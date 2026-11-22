from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from app.models.entities import Job, CandidateProfile, CandidateSkill, SavedJob
from app.services.matching_service import matching_service
from app.services.embedding_service import cosine_similarity
from app.services.geo_service import (
    haversine_distance_km, resolve_location_coordinates, is_within_radius, INDIAN_TECH_LOCATIONS
)

class RetrievalService:
    def get_user_candidate_data(self, db: Session, user_id: str):
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if not profile:
            return None, []
        skills = [s.skill_name for s in profile.skills]
        return profile, skills

    def retrieve_and_rank_jobs(
        self,
        db: Session,
        user_id: Optional[str] = None,
        query: Optional[str] = None,
        role: Optional[str] = None,
        country: Optional[str] = "India",
        city: Optional[str] = None,
        state: Optional[str] = None,
        locality: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        location: Optional[str] = None,
        workplace_type: Optional[str] = None,
        work_modes: Optional[List[str]] = None,
        employment_type: Optional[str] = None,
        opportunity_type: Optional[str] = None,
        min_stipend: Optional[int] = None,
        max_stipend: Optional[int] = None,
        stipend_type: Optional[str] = None,
        ppo_filter: Optional[str] = None,
        company_type: Optional[str] = None,
        verification_status: Optional[str] = None,
        min_salary: Optional[int] = None,
        max_experience: Optional[float] = None,
        sort_by: str = "relevance",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves jobs with comprehensive India-first SQL and geo-radius filtering.
        Ranks opportunities using hybrid matching algorithm.
        """
        profile = None
        skills = []
        saved_job_ids = set()

        if user_id:
            profile, skills = self.get_user_candidate_data(db, user_id)
            saved_records = db.query(SavedJob.job_id).filter(SavedJob.user_id == user_id).all()
            saved_job_ids = {r[0] for r in saved_records}

        # Resolve user coordinate reference for radius calculations
        ref_lat = user_lat
        ref_lng = user_lng
        if (ref_lat is None or ref_lng is None) and city:
            c_lat, c_lng, _ = resolve_location_coordinates(city, locality)
            if c_lat and c_lng:
                ref_lat, ref_lng = c_lat, c_lng
        elif (ref_lat is None or ref_lng is None) and profile and profile.latitude and profile.longitude:
            ref_lat, ref_lng = profile.latitude, profile.longitude

        # Base query
        jobs_query = db.query(Job)

        # 1. Country filter (India default vs International)
        if country and country.lower() != "all":
            if country.lower() in ["india", "in", "🇮🇳 india"]:
                jobs_query = jobs_query.filter(
                    (Job.country.ilike("%india%")) | (Job.country.is_(None))
                )
            elif country.lower() in ["international", "global", "other", "🌐 international"]:
                jobs_query = jobs_query.filter(
                    (~Job.country.ilike("%india%")) & (Job.country.is_not(None))
                )
            else:
                jobs_query = jobs_query.filter(
                    (Job.country.ilike(f"%{country}%")) & (~Job.country.ilike("%india%"))
                )

        # 2. Text Search
        if query:
            q_pattern = f"%{query}%"
            jobs_query = jobs_query.filter(
                (Job.title.ilike(q_pattern)) | 
                (Job.company.ilike(q_pattern)) | 
                (Job.description.ilike(q_pattern)) |
                (Job.location.ilike(q_pattern))
            )

        if role:
            jobs_query = jobs_query.filter(Job.title.ilike(f"%{role}%"))

        # 3. Location & Locality Filtering
        if state and state.lower() != "all":
            jobs_query = jobs_query.filter(Job.state.ilike(f"%{state}%"))

        if city and city.lower() != "all" and not radius_km:
            jobs_query = jobs_query.filter(
                (Job.city.ilike(f"%{city}%")) |
                (Job.location.ilike(f"%{city}%")) |
                (Job.work_mode.ilike("%remote%")) |
                (Job.workplace_type.ilike("%remote%"))
            )

        if location and location.lower() != "all" and not city:
            jobs_query = jobs_query.filter(Job.location.ilike(f"%{location}%"))

        # 4. Work Mode Filtering (multi-select supported)
        selected_modes = []
        if work_modes:
            selected_modes.extend([m.lower() for m in work_modes if m])
        elif workplace_type and workplace_type.lower() != "all":
            selected_modes.append(workplace_type.lower())

        if selected_modes:
            mode_clauses = []
            for m in selected_modes:
                mode_clauses.append(Job.work_mode.ilike(f"%{m}%"))
                mode_clauses.append(Job.workplace_type.ilike(f"%{m}%"))
            jobs_query = jobs_query.filter(or_(*mode_clauses))

        # 5. Opportunity & Employment Type
        if opportunity_type and opportunity_type.lower() != "all":
            jobs_query = jobs_query.filter(Job.opportunity_type.ilike(f"%{opportunity_type}%"))
        elif employment_type and employment_type.lower() != "all":
            jobs_query = jobs_query.filter(Job.employment_type.ilike(f"%{employment_type}%"))

        # 6. Stipend Filter
        if min_stipend is not None:
            jobs_query = jobs_query.filter(
                (Job.stipend_amount_max.is_(None)) | (Job.stipend_amount_max >= min_stipend)
            )

        if max_stipend is not None:
            jobs_query = jobs_query.filter(
                (Job.stipend_amount_min.is_(None)) | (Job.stipend_amount_min <= max_stipend)
            )

        if stipend_type and stipend_type.lower() != "all":
            jobs_query = jobs_query.filter(Job.stipend_type.ilike(f"%{stipend_type}%"))

        if min_salary:
            jobs_query = jobs_query.filter(
                (Job.salary_max.is_(None)) | (Job.salary_max >= min_salary)
            )

        # 7. PPO Filter
        if ppo_filter and ppo_filter.lower() != "all":
            if ppo_filter == "ppo_only":
                jobs_query = jobs_query.filter(
                    Job.ppo_availability.in_(["PPO Available", "Full-time Conversion Opportunity"])
                )
            elif ppo_filter == "potential_ppo":
                jobs_query = jobs_query.filter(
                    Job.ppo_availability.in_(["PPO Available", "Potential PPO", "Full-time Conversion Opportunity"])
                )
            else:
                jobs_query = jobs_query.filter(Job.ppo_availability.ilike(f"%{ppo_filter}%"))

        # 8. Company Type & Verification Status
        if company_type and company_type.lower() != "all":
            jobs_query = jobs_query.filter(Job.company_type.ilike(f"%{company_type}%"))

        if verification_status and verification_status.lower() != "all":
            jobs_query = jobs_query.filter(Job.verification_status.ilike(f"%{verification_status}%"))

        if max_experience is not None:
            jobs_query = jobs_query.filter(Job.experience_required <= max_experience)

        # Retrieve candidates from DB
        all_jobs = jobs_query.limit(limit * 2).all()

        results = []
        for job in all_jobs:
            is_saved = job.id in saved_job_ids

            # Calculate distance if reference coordinates exist
            distance_km = None
            is_remote = (job.work_mode or job.workplace_type or "").lower() == "remote"

            if ref_lat is not None and ref_lng is not None:
                if job.latitude is not None and job.longitude is not None:
                    distance_km = haversine_distance_km(ref_lat, ref_lng, job.latitude, job.longitude)
                elif is_remote:
                    distance_km = 0.0

            # Radius filter check
            if radius_km and ref_lat is not None and ref_lng is not None:
                if not is_remote and distance_km is not None and distance_km > radius_km:
                    continue

            # Hybrid scoring
            if profile:
                match_data = matching_service.calculate_hybrid_match(profile, skills, job)
                results.append({
                    "job": job,
                    "is_saved": is_saved,
                    "distance_km": distance_km or match_data.get("distance_km"),
                    "match_score": match_data["final_score"],
                    "match_tier": match_data["tier"],
                    "match_explanation": match_data["explanation"]["why_match"],
                    "match_data": match_data
                })
            else:
                # Baseline for unauthenticated browsing
                base_score = 80.0 if is_remote or (job.country == "India") else 72.0
                results.append({
                    "job": job,
                    "is_saved": is_saved,
                    "distance_km": distance_km,
                    "match_score": base_score,
                    "match_tier": "Strong Match" if base_score >= 70 else "Moderate Match",
                    "match_explanation": "Sign in to view your personalized profile compatibility score.",
                    "match_data": None
                })

        # Apply sorting: nearest, stipend_high, relevance, newest, deadline, ppo_first
        if sort_by == "nearest":
            results.sort(key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 9999.0))
        elif sort_by == "stipend_high":
            results.sort(key=lambda x: (x["job"].stipend_amount_max or x["job"].salary_max or 0), reverse=True)
        elif sort_by == "newest":
            results.sort(key=lambda x: x["job"].created_at, reverse=True)
        elif sort_by == "deadline":
            now_dt = datetime.now(timezone.utc)
            results.sort(key=lambda x: (x["job"].application_deadline or datetime.max.replace(tzinfo=timezone.utc)))
        elif sort_by == "ppo_first":
            def ppo_weight(j):
                avail = j.ppo_availability or ""
                if "Available" in avail or "Conversion" in avail:
                    return 2
                if "Potential" in avail:
                    return 1
                return 0
            results.sort(key=lambda x: (ppo_weight(x["job"]), x["match_score"]), reverse=True)
        else: # relevance
            results.sort(key=lambda x: x["match_score"], reverse=True)

        return results[:limit]

retrieval_service = RetrievalService()
