from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import cast, Text
from app.models.entities import Job, CandidateProfile, CandidateSkill, SavedJob
from app.services.matching_service import matching_service, normalize_skill
from app.services.embedding_service import embedding_service

def tool_get_candidate_profile(db: Session, user_id: str) -> Dict[str, Any]:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        return {"error": "Candidate profile not yet created. Complete onboarding to enable personalized career intelligence."}
    
    skills = [s.skill_name for s in profile.skills]
    return {
        "current_role": profile.current_role or "Not specified",
        "experience_years": profile.experience_years,
        "location": profile.location or "Not specified",
        "preferred_roles": profile.preferred_roles or [],
        "preferred_locations": profile.preferred_locations or [],
        "salary_expectation": profile.salary_expectation,
        "skills": skills,
        "bio": profile.bio
    }

def format_stipend_display(job: Job) -> str:
    if job.stipend_type == "Unpaid":
        return "Unpaid"
    if job.stipend_type == "Not disclosed" or (not job.stipend_amount_min and not job.stipend_amount_max and not job.salary_min):
        return "Not disclosed"
    
    currency = "₹" if (job.stipend_currency or "INR") == "INR" else "$"
    
    if job.stipend_amount_min and job.stipend_amount_max:
        if job.stipend_amount_min == job.stipend_amount_max:
            return f"{currency}{job.stipend_amount_min:,}/month ({job.stipend_type})"
        return f"{currency}{job.stipend_amount_min:,}–{currency}{job.stipend_amount_max:,}/month ({job.stipend_type})"
    elif job.stipend_amount_min:
        return f"{currency}{job.stipend_amount_min:,}+/month ({job.stipend_type})"
    elif job.salary_min and job.salary_max:
        return f"{currency}{job.salary_min:,} - {currency}{job.salary_max:,}/yr"
    return "Competitive"

def tool_search_jobs(
    db: Session,
    user_id: Optional[str] = None,
    query: Optional[str] = None,
    role: Optional[str] = None,
    location: Optional[str] = None,
    city: Optional[str] = None,
    min_stipend: Optional[int] = None,
    ppo_only: bool = False,
    work_mode: Optional[str] = None,
    limit: int = 5
) -> List[Dict[str, Any]]:
    jobs_q = db.query(Job)
    if query:
        pattern = f"%{query}%"
        jobs_q = jobs_q.filter(
            (Job.title.ilike(pattern)) |
            (Job.company.ilike(pattern)) |
            (Job.description.ilike(pattern)) |
            (Job.location.ilike(pattern)) |
            (cast(Job.required_skills, Text).ilike(pattern))
        )
    if role:
        jobs_q = jobs_q.filter(Job.title.ilike(f"%{role}%"))
    if city and city.lower() != "all":
        jobs_q = jobs_q.filter((Job.city.ilike(f"%{city}%")) | (Job.location.ilike(f"%{city}%")))
    elif location and location.lower() != "all":
        jobs_q = jobs_q.filter(Job.location.ilike(f"%{location}%"))

    if work_mode and work_mode.lower() != "all":
        jobs_q = jobs_q.filter(Job.work_mode.ilike(f"%{work_mode}%"))

    if min_stipend:
        jobs_q = jobs_q.filter((Job.stipend_amount_max.is_(None)) | (Job.stipend_amount_max >= min_stipend))

    if ppo_only:
        jobs_q = jobs_q.filter(Job.ppo_availability.in_(["PPO Available", "Full-time Conversion Opportunity"]))

    jobs = jobs_q.limit(limit).all()

    profile = None
    skills = []
    if user_id:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if profile:
            skills = [s.skill_name for s in profile.skills]

    out = []
    for job in jobs:
        score = 80.0
        exp_match = ""
        tier = "Strong Match"
        if profile:
            match = matching_service.calculate_hybrid_match(profile, skills, job)
            score = match["final_score"]
            exp_match = match["explanation"]["why_match"]
            tier = match["tier"]

        out.append({
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "company_type": job.company_type,
            "location": job.location,
            "work_mode": job.work_mode,
            "remote_details": job.remote_details,
            "monthly_stipend": format_stipend_display(job),
            "duration_months": f"{job.duration_months} months" if job.duration_months else "Flexible",
            "ppo_status": f"⭐ {job.ppo_availability}",
            "ppo_terms": job.ppo_terms,
            "verification_status": f"🟢 {job.verification_status}",
            "source_platform": job.source_platform,
            "experience_required": job.experience_required,
            "required_skills": job.required_skills,
            "match_score": score,
            "match_tier": tier,
            "match_summary": exp_match,
            "application_url": job.application_url
        })
    out.sort(key=lambda x: x["match_score"], reverse=True)
    return out

def tool_get_job_details(db: Session, job_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        # Try finding by partial title/company if not an exact UUID
        job = db.query(Job).filter((Job.title.ilike(f"%{job_id}%")) | (Job.company.ilike(f"%{job_id}%"))).first()
    if not job:
        return {"error": f"Job opportunity '{job_id}' not found in the NEXORA catalog."}

    match_info = None
    if user_id:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if profile:
            skills = [s.skill_name for s in profile.skills]
            match_info = matching_service.calculate_hybrid_match(profile, skills, job)

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "workplace_type": job.workplace_type,
        "employment_type": job.employment_type,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "experience_required": job.experience_required,
        "description": job.description,
        "required_skills": job.required_skills,
        "preferred_skills": job.preferred_skills,
        "responsibilities": job.responsibilities,
        "qualifications": job.qualifications,
        "application_url": job.application_url,
        "is_demo": job.is_demo,
        "match": match_info
    }

def tool_compare_jobs(db: Session, job_id_1: str, job_id_2: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    job1 = tool_get_job_details(db, job_id_1, user_id)
    job2 = tool_get_job_details(db, job_id_2, user_id)

    if "error" in job1:
        return {"error": f"Could not resolve first job: {job1['error']}"}
    if "error" in job2:
        return {"error": f"Could not resolve second job: {job2['error']}"}

    score1 = job1.get("match", {}).get("final_score", 75.0) if job1.get("match") else 75.0
    score2 = job2.get("match", {}).get("final_score", 75.0) if job2.get("match") else 75.0

    winner = job1["title"] if score1 >= score2 else job2["title"]

    return {
        "job_1": {
            "title": job1["title"],
            "company": job1["company"],
            "score": score1,
            "salary": f"${job1.get('salary_min', 0):,} - ${job1.get('salary_max', 0):,}",
            "location": job1["location"],
            "skills": job1["required_skills"]
        },
        "job_2": {
            "title": job2["title"],
            "company": job2["company"],
            "score": score2,
            "salary": f"${job2.get('salary_min', 0):,} - ${job2.get('salary_max', 0):,}",
            "location": job2["location"],
            "skills": job2["required_skills"]
        },
        "comparison_summary": f"Comparing {job1['title']} at {job1['company']} ({score1}% match) with {job2['title']} at {job2['company']} ({score2}% match). Higher relative compatibility: {winner}."
    }

def tool_analyze_skill_gap(db: Session, target_role_or_job: str, user_id: str) -> Dict[str, Any]:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    candidate_skills = [s.skill_name for s in profile.skills] if profile else []

    # Check if target is an existing job
    job = db.query(Job).filter((Job.id == target_role_or_job) | (Job.title.ilike(f"%{target_role_or_job}%"))).first()
    
    if job:
        req_skills = job.required_skills or []
        pref_skills = job.preferred_skills or []
        target_name = f"{job.title} at {job.company}"
    else:
        # Standard skill requirements based on role keywords
        target_name = target_role_or_job
        req_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs"]
        pref_skills = ["Kubernetes", "Redis", "RAG", "LangChain"]
        if any(w in target_role_or_job.lower() for w in ["ai", "machine learning", "ml", "rag"]):
            req_skills = ["Python", "FastAPI", "PostgreSQL", "LLMs", "RAG", "LangChain"]
            pref_skills = ["pgvector", "LangGraph", "Docker", "Model Evaluation"]

    norm_cand = {normalize_skill(s) for s in candidate_skills}
    matched = []
    missing_req = []
    for s in req_skills:
        if any(normalize_skill(s) in c or c in normalize_skill(s) for c in norm_cand):
            matched.append(s)
        else:
            missing_req.append(s)

    missing_pref = [s for s in pref_skills if not any(normalize_skill(s) in c or c in normalize_skill(s) for c in norm_cand)]

    total = len(req_skills) + len(pref_skills)
    compat = round((len(matched) / max(1, total)) * 100, 1)

    learning_priorities = [
        f"Master {skill} with a hands-on project" for skill in (missing_req[:3] or missing_pref[:3])
    ]
    if not learning_priorities:
        learning_priorities = ["Solidify architecture depth and production system design."]

    return {
        "target": target_name,
        "compatibility_score": compat,
        "matched_skills": matched,
        "missing_required_skills": missing_req,
        "missing_preferred_skills": missing_pref,
        "learning_priorities": learning_priorities
    }

def tool_get_saved_jobs(db: Session, user_id: str) -> List[Dict[str, Any]]:
    saved = db.query(SavedJob).filter(SavedJob.user_id == user_id).all()
    results = []
    for s in saved:
        results.append({
            "id": s.job.id,
            "title": s.job.title,
            "company": s.job.company,
            "location": s.job.location,
            "salary": f"${s.job.salary_min:,} - ${s.job.salary_max:,}" if s.job.salary_min else "Competitive",
            "saved_at": s.saved_at.isoformat()
        })
    return results

def tool_generate_career_recommendations(db: Session, user_id: str) -> Dict[str, Any]:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        return {"error": "Candidate profile needed for recommendations."}
    
    skills = [s.skill_name for s in profile.skills]
    jobs = db.query(Job).limit(20).all()

    ranked = []
    for j in jobs:
        match = matching_service.calculate_hybrid_match(profile, skills, j)
        ranked.append({
            "job_id": j.id,
            "title": j.title,
            "company": j.company,
            "match_score": match["final_score"],
            "tier": match["tier"],
            "why_match": match["explanation"]["why_match"]
        })
    ranked.sort(key=lambda x: x["match_score"], reverse=True)

    top_roles = [j["title"] for j in ranked[:3]]
    return {
        "candidate_current_role": profile.current_role,
        "top_recommended_roles": list(dict.fromkeys(top_roles)),
        "best_job_matches": ranked[:4],
        "strategic_focus": "Target roles leveraging your strongest skills while closing identified gaps in container orchestration and vector retrieval."
    }
