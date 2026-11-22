from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Job, CandidateProfile, User, MatchHistory
from app.schemas.all_schemas import (
    SmartMatchesResponse, SmartMatchOut, MatchBreakdown, MatchExplanation,
    SkillGapAnalysisResponse, SkillGapItem, JobOut
)
from app.api.deps import get_current_user
from app.services.matching_service import matching_service, normalize_skill
from app.services.retrieval_service import retrieval_service
from app.services.embedding_service import embedding_service

from app.api.jobs import to_job_out

router = APIRouter(prefix="/matching", tags=["AI Matching & Intelligence"])

@router.get("/smart-matches", response_model=SmartMatchesResponse)
def get_smart_matches(
    country: Optional[str] = Query("India"),
    city: Optional[str] = Query(None),
    radius_km: Optional[float] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile, skills = retrieval_service.get_user_candidate_data(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your profile to compute AI Smart Matches.")

    ranked = retrieval_service.retrieve_and_rank_jobs(
        db=db,
        user_id=current_user.id,
        country=country,
        city=city,
        radius_km=radius_km,
        sort_by="relevance",
        limit=limit
    )

    excellent_matches = []
    strong_matches = []
    moderate_matches = []
    low_matches = []

    for item in ranked:
        job = item["job"]
        match_res = item["match_data"]
        if not match_res:
            continue

        job_out = to_job_out(
            job=job,
            match_score=match_res["final_score"],
            match_explanation=match_res["explanation"]["why_match"],
            match_tier=match_res["tier"],
            is_saved=item.get("is_saved", False),
            distance_km=item.get("distance_km")
        )

        smart_item = SmartMatchOut(
            job=job_out,
            breakdown=MatchBreakdown(**match_res["breakdown"]),
            explanation=MatchExplanation(**match_res["explanation"]),
            tier=match_res["tier"]
        )

        if match_res["tier"] == "Excellent Match":
            excellent_matches.append(smart_item)
        elif match_res["tier"] == "Strong Match":
            strong_matches.append(smart_item)
        elif match_res["tier"] == "Moderate Match":
            moderate_matches.append(smart_item)
        else:
            low_matches.append(smart_item)

    # Sort each tier descending by final_score
    excellent_matches.sort(key=lambda x: x.breakdown.final_score, reverse=True)
    strong_matches.sort(key=lambda x: x.breakdown.final_score, reverse=True)
    moderate_matches.sort(key=lambda x: x.breakdown.final_score, reverse=True)
    low_matches.sort(key=lambda x: x.breakdown.final_score, reverse=True)

    return SmartMatchesResponse(
        excellent_matches=excellent_matches,
        strong_matches=strong_matches,
        moderate_matches=moderate_matches,
        low_matches=low_matches,
        best_matches=excellent_matches,
        potential_matches=moderate_matches + low_matches,
        total_evaluated=len(ranked)
    )

@router.get("/skill-gap", response_model=SkillGapAnalysisResponse)
def get_skill_gap(
    target: str = Query("AI Backend Engineer", description="Target job title or job ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile, candidate_skills = retrieval_service.get_user_candidate_data(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Profile required for skill gap diagnostics.")

    # Search if target is an existing job
    job = db.query(Job).filter((Job.id == target) | (Job.title.ilike(f"%{target}%"))).first()
    
    if job:
        target_name = f"{job.title} at {job.company}"
        req_skills = job.required_skills or []
        pref_skills = job.preferred_skills or []
    else:
        target_name = target
        req_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs"]
        pref_skills = ["Kubernetes", "Redis", "LangChain", "RAG"]
        if any(w in target.lower() for w in ["ai", "machine learning", "ml", "rag"]):
            req_skills = ["Python", "FastAPI", "PostgreSQL", "LLMs", "RAG", "LangChain"]
            pref_skills = ["pgvector", "LangGraph", "Docker", "Model Evaluation"]

    norm_cand = {normalize_skill(s) for s in candidate_skills}

    skill_items = []
    matched_count = 0
    missing_count = 0

    for s in req_skills:
        if any(normalize_skill(s) in c or c in normalize_skill(s) for c in norm_cand):
            matched_count += 1
            skill_items.append(SkillGapItem(
                skill_name=s,
                status="matched",
                importance="Critical",
                learning_resource_hint=f"Strengthen your portfolio projects demonstrating {s} architecture."
            ))
        else:
            missing_count += 1
            skill_items.append(SkillGapItem(
                skill_name=s,
                status="missing_required",
                importance="Critical",
                learning_resource_hint=f"High priority: build an end-to-end service or tutorial demonstrating {s} production use."
            ))

    for s in pref_skills:
        if any(normalize_skill(s) in c or c in normalize_skill(s) for c in norm_cand):
            matched_count += 1
            skill_items.append(SkillGapItem(
                skill_name=s,
                status="matched",
                importance="High",
                learning_resource_hint=f"Showcase {s} in your GitHub repositories or technical interviews."
            ))
        else:
            missing_count += 1
            skill_items.append(SkillGapItem(
                skill_name=s,
                status="missing_preferred",
                importance="High",
                learning_resource_hint=f"Recommended for senior tier: explore {s} docs and practical integration patterns."
            ))

    total = len(req_skills) + len(pref_skills)
    overall_compat = round((matched_count / max(1, total)) * 100, 1)

    priorities = [
        f"Master {item.skill_name} ({item.importance} requirement)"
        for item in skill_items if item.status.startswith("missing")
    ][:4]
    if not priorities:
        priorities = ["Solidify distributed system designs and scale benchmark testing."]

    guidance = (
        f"For '{target_name}', your skill compatibility stands at {overall_compat}%. "
        f"You match {matched_count} out of {total} key technologies. "
        f"Focusing on the identified critical gaps will directly boost your hybrid match ranking."
    )

    return SkillGapAnalysisResponse(
        target_role_or_job=target_name,
        overall_compatibility=overall_compat,
        matched_count=matched_count,
        missing_count=missing_count,
        skills=skill_items,
        learning_priorities=priorities,
        ai_guidance=guidance
    )
