from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Job, SavedJob, User, CandidateProfile, CandidateSkill, Company
from app.schemas.all_schemas import JobOut, JobListResponse, JobCreate
from app.api.deps import get_current_user, get_optional_user
from app.services.retrieval_service import retrieval_service
from app.services.matching_service import matching_service
from app.services.embedding_service import embedding_service
from app.services.verification_service import verification_service
from app.services.geo_service import resolve_location_coordinates

router = APIRouter(prefix="/jobs", tags=["Jobs & Opportunities"])

def to_job_out(
    job: Job,
    match_score: Optional[float] = None,
    match_explanation: Optional[str] = None,
    match_tier: Optional[str] = None,
    is_saved: Optional[bool] = False,
    distance_km: Optional[float] = None
) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        company=job.company,
        company_logo=job.company_logo,
        company_type=job.company_type or "Product-based",
        description=job.description,
        location=job.location,
        country=job.country or "India",
        state=job.state,
        city=job.city,
        locality=job.locality,
        latitude=job.latitude,
        longitude=job.longitude,
        workplace_type=job.workplace_type or "Remote",
        work_mode=job.work_mode or "Remote",
        remote_details=job.remote_details or "Work from anywhere in India",
        opportunity_type=job.opportunity_type or "Internship",
        stipend_type=job.stipend_type or "Fixed stipend",
        stipend_amount_min=job.stipend_amount_min,
        stipend_amount_max=job.stipend_amount_max,
        stipend_currency=job.stipend_currency or "INR",
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        duration_months=job.duration_months or 3,
        ppo_availability=job.ppo_availability or "No PPO Mentioned",
        ppo_terms=job.ppo_terms,
        ppo_eligible_criteria=job.ppo_eligible_criteria,
        experience_required=job.experience_required or 0.0,
        employment_type=job.employment_type or "Internship",
        required_skills=job.required_skills or [],
        preferred_skills=job.preferred_skills or [],
        responsibilities=job.responsibilities or [],
        qualifications=job.qualifications or [],
        eligibility_criteria=job.eligibility_criteria or [],
        benefits=job.benefits or [],
        application_url=job.application_url,
        source_platform=job.source_platform or "Official Portal",
        source_url=job.source_url,
        verification_status=job.verification_status or "Verified",
        verified_at=job.verified_at,
        application_deadline=job.application_deadline,
        is_expired=job.is_expired or False,
        is_demo=job.is_demo or False,
        trust_badge=job.trust_badge or "Verified Employer",
        fraud_risk_score=job.fraud_risk_score if job.fraud_risk_score is not None else 10,
        fraud_risk_level=job.fraud_risk_level or "Low Risk",
        is_fee_required=bool(job.is_fee_required),
        is_application_blocked=bool(job.is_application_blocked),
        block_reason=job.block_reason,
        recruiter_name=job.recruiter_name,
        recruiter_email=job.recruiter_email,
        recruiter_verification=job.recruiter_verification or "Verified",
        last_safety_audit=job.last_safety_audit,
        created_at=job.created_at,
        match_score=match_score,
        match_explanation=match_explanation,
        match_tier=match_tier,
        is_saved=is_saved or False,
        distance_km=distance_km
    )

class JobMatchRequest(BaseModel):
    job_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    experience_required: Optional[float] = 0.0
    location: Optional[str] = "Remote"
    workplace_type: Optional[str] = "Remote"

@router.get("", response_model=JobListResponse)
def get_jobs(
    query: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    country: Optional[str] = Query("India"),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    workplace_type: Optional[str] = Query(None),
    work_modes: Optional[List[str]] = Query(None),
    employment_type: Optional[str] = Query(None),
    opportunity_type: Optional[str] = Query(None),
    min_stipend: Optional[int] = Query(None),
    max_stipend: Optional[int] = Query(None),
    stipend_type: Optional[str] = Query(None),
    ppo_filter: Optional[str] = Query(None),
    company_type: Optional[str] = Query(None),
    verification_status: Optional[str] = Query(None),
    min_salary: Optional[int] = Query(None),
    max_experience: Optional[float] = Query(None),
    sort_by: str = Query("relevance"), # nearest, stipend_high, relevance, newest, deadline, ppo_first
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    ranked_results = retrieval_service.retrieve_and_rank_jobs(
        db=db,
        user_id=user_id,
        query=query,
        role=role,
        country=country,
        city=city,
        state=state,
        locality=locality,
        user_lat=user_lat,
        user_lng=user_lng,
        radius_km=radius_km,
        location=location,
        workplace_type=workplace_type,
        work_modes=work_modes,
        employment_type=employment_type,
        opportunity_type=opportunity_type,
        min_stipend=min_stipend,
        max_stipend=max_stipend,
        stipend_type=stipend_type,
        ppo_filter=ppo_filter,
        company_type=company_type,
        verification_status=verification_status,
        min_salary=min_salary,
        max_experience=max_experience,
        sort_by=sort_by,
        limit=200
    )

    total = len(ranked_results)
    start = (page - 1) * page_size
    end = start + page_size
    sliced = ranked_results[start:end]

    items = []
    for item in sliced:
        items.append(to_job_out(
            job=item["job"],
            match_score=item.get("match_score"),
            match_explanation=item.get("match_explanation"),
            match_tier=item.get("match_tier"),
            is_saved=item.get("is_saved", False),
            distance_km=item.get("distance_km")
        ))

    total_pages = max(1, (total + page_size - 1) // page_size)
    return JobListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/companies")
def get_verified_companies(db: Session = Depends(get_db)):
    comps = db.query(Company).order_by(Company.name).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "company_type": c.company_type,
            "headquarters": c.headquarters,
            "is_verified": c.is_verified,
            "website": c.website,
            "careers_url": c.careers_url
        }
        for c in comps
    ]

@router.post("/verify")
def run_verification(db: Session = Depends(get_db)):
    result = verification_service.run_batch_verification(db)
    return {
        "status": "success",
        "message": "Batch opportunity verification completed.",
        "results": result
    }

@router.post("/{job_id}/verify")
def verify_single_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    res = verification_service.verify_job(db, job)
    return res

@router.post("/match")
async def calculate_job_match(
    payload: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile, skills = retrieval_service.get_user_candidate_data(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Candidate profile required to run AI matching.")

    if payload.job_id:
        target_job = db.query(Job).filter(Job.id == payload.job_id).first()
        if not target_job:
            raise HTTPException(status_code=404, detail="Opportunity not found.")
    else:
        # Create ad-hoc job representation
        job_text = embedding_service.build_job_text(
            title=payload.title or "Software Engineer",
            company="Prospective Employer",
            description=payload.description or "",
            required_skills=payload.required_skills or []
        )
        vec = await embedding_service.generate_embedding(job_text)
        target_job = Job(
            title=payload.title or "Software Engineer",
            company="Prospective Employer",
            description=payload.description or "",
            location=payload.location or "Remote",
            workplace_type=payload.workplace_type or "Remote",
            experience_required=payload.experience_required or 0.0,
            required_skills=payload.required_skills or [],
            embedding=vec
        )

    match_res = matching_service.calculate_hybrid_match(profile, skills, target_job)
    return {
        "job_id": target_job.id if target_job.id else None,
        "title": target_job.title,
        "company": target_job.company,
        "final_score": match_res["final_score"],
        "tier": match_res["tier"],
        "breakdown": match_res["breakdown"],
        "explanation": match_res["explanation"]
    }

@router.get("/recommendations", response_model=List[JobOut])
def get_recommendations(
    country: Optional[str] = Query("India"),
    city: Optional[str] = Query(None),
    radius_km: Optional[float] = Query(None),
    limit: int = Query(6, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ranked = retrieval_service.retrieve_and_rank_jobs(
        db=db,
        user_id=current_user.id,
        country=country,
        city=city,
        radius_km=radius_km,
        sort_by="relevance",
        limit=limit
    )
    items = []
    for item in ranked:
        items.append(to_job_out(
            job=item["job"],
            match_score=item.get("match_score"),
            match_explanation=item.get("match_explanation"),
            match_tier=item.get("match_tier"),
            is_saved=item.get("is_saved", False),
            distance_km=item.get("distance_km")
        ))
    return items

@router.get("/saved", response_model=List[JobOut])
def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_records = db.query(SavedJob).filter(SavedJob.user_id == current_user.id).all()
    results = []

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    skills = [s.skill_name for s in profile.skills] if profile else []

    for s in saved_records:
        job = s.job
        score = 80.0
        exp = ""
        tier = "Strong Match"
        if profile:
            match = matching_service.calculate_hybrid_match(profile, skills, job)
            score = match["final_score"]
            exp = match["explanation"]["why_match"]
            tier = match["tier"]

        results.append(to_job_out(
            job=job,
            match_score=score,
            match_explanation=exp,
            match_tier=tier,
            is_saved=True
        ))
    return results

@router.get("/{job_id}")
def get_job_by_id(
    job_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    is_saved = False
    match_data = None
    if current_user:
        is_saved = db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job.id).first() is not None
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
        if profile:
            skills = [s.skill_name for s in profile.skills]
            match_data = matching_service.calculate_hybrid_match(profile, skills, job)

    return {
        "job": to_job_out(
            job=job,
            match_score=match_data["final_score"] if match_data else None,
            match_explanation=match_data["explanation"]["why_match"] if match_data else None,
            match_tier=match_data["tier"] if match_data else None,
            is_saved=is_saved
        ),
        "match": match_data
    }

@router.post("/{job_id}/save")
def save_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    existing = db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id).first()
    if not existing:
        saved = SavedJob(user_id=current_user.id, job_id=job_id)
        db.add(saved)
        db.commit()
    return {"message": "Opportunity saved successfully.", "job_id": job_id, "is_saved": True}

@router.delete("/{job_id}/save")
def unsave_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id).delete()
    db.commit()
    return {"message": "Opportunity unsaved successfully.", "job_id": job_id, "is_saved": False}

@router.post("/ingest", response_model=JobOut)
async def ingest_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job_text = embedding_service.build_job_text(
        title=job_in.title,
        company=job_in.company,
        description=job_in.description,
        required_skills=job_in.required_skills,
        preferred_skills=job_in.preferred_skills,
        responsibilities=job_in.responsibilities
    )
    vector = await embedding_service.generate_embedding(job_text)

    new_job = Job(
        title=job_in.title,
        company=job_in.company,
        company_logo=job_in.company_logo,
        company_type=job_in.company_type,
        country=job_in.country or "India",
        state=job_in.state,
        city=job_in.city,
        locality=job_in.locality,
        latitude=job_in.latitude,
        longitude=job_in.longitude,
        description=job_in.description,
        location=job_in.location,
        workplace_type=job_in.workplace_type,
        work_mode=job_in.work_mode,
        remote_details=job_in.remote_details,
        opportunity_type=job_in.opportunity_type,
        stipend_type=job_in.stipend_type,
        stipend_amount_min=job_in.stipend_amount_min,
        stipend_amount_max=job_in.stipend_amount_max,
        stipend_currency=job_in.stipend_currency or "INR",
        duration_months=job_in.duration_months,
        ppo_availability=job_in.ppo_availability,
        ppo_terms=job_in.ppo_terms,
        ppo_eligible_criteria=job_in.ppo_eligible_criteria,
        salary_min=job_in.salary_min,
        salary_max=job_in.salary_max,
        experience_required=job_in.experience_required,
        employment_type=job_in.employment_type,
        required_skills=job_in.required_skills,
        preferred_skills=job_in.preferred_skills,
        responsibilities=job_in.responsibilities,
        qualifications=job_in.qualifications,
        eligibility_criteria=job_in.eligibility_criteria,
        benefits=job_in.benefits,
        application_url=job_in.application_url,
        source_platform=job_in.source_platform or "Direct Submission",
        source_url=job_in.source_url,
        verification_status="Verified" if verification_service.is_authentic_domain(job_in.application_url) else "Verification Pending",
        verified_at=datetime.now(timezone.utc),
        is_demo=False,
        source="user_ingested",
        embedding=vector
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return to_job_out(new_job)
