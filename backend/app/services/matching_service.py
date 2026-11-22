from typing import List, Dict, Any, Tuple, Optional
import math
from app.core.config import settings
from app.models.entities import Job, CandidateProfile, CandidateSkill
from app.services.embedding_service import cosine_similarity
from app.services.geo_service import haversine_distance_km

# Normalized skill alias map for semantic skill equivalence
SKILL_ALIASES = {
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "react.js": "react",
    "reactjs": "react",
    "node": "nodejs",
    "node.js": "nodejs",
    "next": "nextjs",
    "next.js": "nextjs",
    "fast-api": "fastapi",
    "amazon web services": "aws",
    "google cloud platform": "gcp",
    "google cloud": "gcp",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "large language models": "llms",
    "large language model": "llms",
    "llm": "llms",
    "rag": "retrieval augmented generation",
    "vector database": "vector db",
    "pg_vector": "pgvector"
}

def normalize_skill(name: str) -> str:
    cleaned = name.lower().strip()
    return SKILL_ALIASES.get(cleaned, cleaned)

class MatchingService:
    def __init__(self):
        # 60% Semantic, 25% Skill, 10% Experience/Eligibility, 5% Location
        self.w_semantic = settings.WEIGHT_SEMANTIC # 0.60
        self.w_skill = settings.WEIGHT_SKILL       # 0.25
        self.w_exp = settings.WEIGHT_EXPERIENCE    # 0.10
        self.w_loc = settings.WEIGHT_LOCATION      # 0.05

    def calculate_skill_compatibility(
        self, candidate_skills: List[str], required_skills: List[str], preferred_skills: List[str] = None
    ) -> Tuple[float, List[str], List[str]]:
        if not required_skills and not preferred_skills:
            return 1.0, [], []

        norm_candidate = {normalize_skill(s) for s in candidate_skills}
        req_skills = required_skills or []
        pref_skills = preferred_skills or []

        matched_skills = []
        missing_skills = []

        # Check required skills (80% weight)
        req_matched = 0
        for s in req_skills:
            norm_s = normalize_skill(s)
            if any(norm_s == c or norm_s in c or c in norm_s for c in norm_candidate):
                req_matched += 1
                matched_skills.append(s)
            else:
                missing_skills.append(s)

        # Check preferred skills (20% weight)
        pref_matched = 0
        for s in pref_skills:
            norm_s = normalize_skill(s)
            if any(norm_s == c or norm_s in c or c in norm_s for c in norm_candidate):
                pref_matched += 1
                if s not in matched_skills:
                    matched_skills.append(s)

        total_req = max(1, len(req_skills))
        req_ratio = req_matched / total_req
        pref_ratio = (pref_matched / len(pref_skills)) if pref_skills else 1.0

        skill_score = (req_ratio * 0.8) + (pref_ratio * 0.2)
        return min(1.0, max(0.0, skill_score)), matched_skills, missing_skills

    def calculate_experience_and_eligibility(
        self, candidate_profile: CandidateProfile, job: Job
    ) -> Tuple[float, str]:
        """
        Evaluates 10% weight: checks experience duration and academic/graduation eligibility.
        """
        required_exp = job.experience_required or 0.0
        cand_exp = candidate_profile.experience_years or 0.0
        
        # Internships usually require 0 exp; check student graduation year
        fit_notes = []
        base_score = 1.0
        
        if required_exp > 0:
            if cand_exp >= required_exp:
                base_score = 1.0
                fit_notes.append(f"Meets or exceeds required {required_exp:.1f} years experience.")
            else:
                diff = required_exp - cand_exp
                base_score = max(0.3, 1.0 - (diff * 0.2))
                fit_notes.append(f"{cand_exp:.1f} yrs vs {required_exp:.1f} yrs required.")
        else:
            fit_notes.append("Entry-level / Internship open to college students & fresh graduates.")

        # Batch / graduation year verification if specified in eligibility
        if job.eligibility_criteria and candidate_profile.graduation_year:
            cand_year_str = str(candidate_profile.graduation_year)
            matches_criteria = any(cand_year_str in str(crit) for crit in job.eligibility_criteria)
            if matches_criteria:
                fit_notes.append(f"Matches target batch {cand_year_str}.")
            else:
                fit_notes.append(f"Batch {cand_year_str} candidate profile.")

        eligibility_summary = " ".join(fit_notes)
        return min(1.0, max(0.2, base_score)), eligibility_summary

    def calculate_location_compatibility(
        self,
        candidate_profile: CandidateProfile,
        job: Job
    ) -> Tuple[float, Optional[float]]:
        """
        Evaluates 5% weight: exact coordinates Haversine distance, city, or remote flexibility.
        """
        job_mode = (job.work_mode or job.workplace_type or "").lower()
        if "remote" in job_mode:
            return 1.0, None

        dist_km = None
        # Try exact coordinate distance
        if (
            candidate_profile.latitude is not None and candidate_profile.longitude is not None and
            job.latitude is not None and job.longitude is not None
        ):
            dist_km = haversine_distance_km(
                candidate_profile.latitude, candidate_profile.longitude,
                job.latitude, job.longitude
            )
            if dist_km <= 15.0:
                return 1.0, dist_km
            elif dist_km <= 35.0:
                return 0.90, dist_km
            elif dist_km <= 75.0:
                return 0.75, dist_km
            elif dist_km <= 150.0:
                return 0.55, dist_km
            else:
                score = 0.65 if "hybrid" in job_mode else 0.30
                return score, dist_km

        # Fallback to city string matching
        user_loc = (candidate_profile.city or candidate_profile.location or "").lower()
        job_loc = (job.city or job.location or "").lower()

        if user_loc and job_loc and (user_loc in job_loc or job_loc in user_loc):
            return 1.0, None

        if "hybrid" in job_mode:
            return 0.65, None

        return 0.30, None

    def calculate_hybrid_match(
        self,
        candidate_profile: CandidateProfile,
        candidate_skills: List[str],
        job: Job
    ) -> Dict[str, Any]:
        # 1. Semantic Similarity (60%)
        semantic_score = 0.65
        if candidate_profile.embedding and job.embedding:
            cand_vec = list(candidate_profile.embedding) if not isinstance(candidate_profile.embedding, list) else candidate_profile.embedding
            job_vec = list(job.embedding) if not isinstance(job.embedding, list) else job.embedding
            semantic_score = cosine_similarity(cand_vec, job_vec)

        # 2. Skill Compatibility (25%)
        skill_score, matched_skills, missing_skills = self.calculate_skill_compatibility(
            candidate_skills, job.required_skills or [], job.preferred_skills or []
        )

        # 3. Experience & Eligibility Compatibility (10%)
        exp_score, eligibility_fit = self.calculate_experience_and_eligibility(candidate_profile, job)

        # 4. Location Proximity (5%)
        loc_score, distance_km = self.calculate_location_compatibility(candidate_profile, job)

        # Weighted Final Score (0 - 100)
        final_score = (
            (self.w_semantic * semantic_score) +
            (self.w_skill * skill_score) +
            (self.w_exp * exp_score) +
            (self.w_loc * loc_score)
        ) * 100.0

        final_score = round(max(10.0, min(99.0, final_score)), 1)

        # 4 Tiers:
        # 🟢 85–100%: Excellent Match
        # 🔵 70–84%: Strong Match
        # 🟡 50–69%: Moderate Match
        # 🔴 <50%: Low Match
        if final_score >= 85.0:
            tier = "Excellent Match"
        elif final_score >= 70.0:
            tier = "Strong Match"
        elif final_score >= 50.0:
            tier = "Moderate Match"
        else:
            tier = "Low Match"

        # Generate Grounded Explanation
        explanation = self.generate_grounded_explanation(
            candidate_profile, candidate_skills, job, matched_skills, missing_skills, eligibility_fit, final_score
        )

        return {
            "final_score": final_score,
            "tier": tier,
            "distance_km": distance_km,
            "breakdown": {
                "semantic_score": round(semantic_score * 100, 1),
                "skill_score": round(skill_score * 100, 1),
                "experience_score": round(exp_score * 100, 1),
                "location_score": round(loc_score * 100, 1),
                "final_score": final_score,
                "weights": {
                    "semantic": self.w_semantic,
                    "skill": self.w_skill,
                    "experience": self.w_exp,
                    "location": self.w_loc
                }
            },
            "explanation": explanation
        }

    def generate_grounded_explanation(
        self,
        candidate_profile: CandidateProfile,
        candidate_skills: List[str],
        job: Job,
        matched_skills: List[str],
        missing_skills: List[str],
        eligibility_fit: str,
        final_score: float
    ) -> Dict[str, Any]:
        # Why it matches
        match_reasons = []
        if matched_skills:
            top_matched = ", ".join(matched_skills[:4])
            match_reasons.append(f"Strong overlap on core technologies: {top_matched}.")
        else:
            match_reasons.append(f"Domain skills align with the core focus of {job.title}.")

        if (job.work_mode or job.workplace_type or "").lower() == "remote":
            match_reasons.append("Opportunity offers full remote flexibility across India.")
        elif job.city:
            match_reasons.append(f"Target role located in {job.city}.")

        if job.ppo_availability in ["PPO Available", "Full-time Conversion Opportunity"]:
            match_reasons.append(f"Includes post-internship career growth ({job.ppo_availability}).")

        why_match = " ".join(match_reasons)

        # Why not perfect
        imperfection_reasons = []
        if missing_skills:
            top_missing = ", ".join(missing_skills[:3])
            imperfection_reasons.append(f"Requires familiarity with {top_missing} not currently highlighted on your profile.")
        
        cand_exp = candidate_profile.experience_years or 0.0
        job_exp = job.experience_required or 0.0
        if cand_exp < job_exp:
            imperfection_reasons.append(f"Seeks {job_exp:.1f}+ years experience (profile lists {cand_exp:.1f}).")

        if not imperfection_reasons:
            imperfection_reasons.append("High alignment across technical requirements, eligibility, and location preferences.")

        why_not_perfect = " ".join(imperfection_reasons)

        # How to improve match score
        if missing_skills:
            improvement = f"Complete a portfolio project utilizing {missing_skills[0]} to elevate your match score into the Excellent tier."
        else:
            improvement = "Ensure your GitHub portfolio and verifiable project repos are linked in your profile."

        # Career advantage
        advantage = f"Working with {job.company} provides production experience in {job.company_type} architecture with verified terms ({job.stipend_type})."

        return {
            "why_match": why_match,
            "why_not_perfect": why_not_perfect,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "eligibility_fit": eligibility_fit,
            "improvement_recommendation": improvement,
            "career_advantage": advantage
        }

matching_service = MatchingService()

