from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, CandidateProfile, CandidateSkill
from app.schemas.all_schemas import ProfileCreate, ProfileUpdate, ProfileOut, SkillOut
from app.api.deps import get_current_user
from app.services.embedding_service import embedding_service

router = APIRouter(prefix="/profile", tags=["Candidate Profile"])

@router.get("", response_model=ProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding."
        )
    return profile

@router.post("", response_model=ProfileOut)
async def create_or_update_profile(
    profile_in: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    
    # Extract skill names
    skill_names = [s.skill_name for s in profile_in.skills]

    # Generate semantic embedding
    text_repr = embedding_service.build_candidate_text(
        current_role=profile_in.current_role,
        experience_years=profile_in.experience_years,
        preferred_roles=profile_in.preferred_roles,
        skills=skill_names,
        bio=profile_in.bio
    )
    vector = await embedding_service.generate_embedding(text_repr)

    if not profile:
        profile = CandidateProfile(
            user_id=current_user.id,
            current_role=profile_in.current_role,
            experience_years=profile_in.experience_years,
            location=profile_in.location,
            preferred_roles=profile_in.preferred_roles,
            preferred_locations=profile_in.preferred_locations,
            salary_expectation=profile_in.salary_expectation,
            employment_preference=profile_in.employment_preference,
            bio=profile_in.bio,
            embedding=vector
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        profile.current_role = profile_in.current_role
        profile.experience_years = profile_in.experience_years
        profile.location = profile_in.location
        profile.preferred_roles = profile_in.preferred_roles
        profile.preferred_locations = profile_in.preferred_locations
        profile.salary_expectation = profile_in.salary_expectation
        profile.employment_preference = profile_in.employment_preference
        profile.bio = profile_in.bio
        profile.embedding = vector

    # Update skills
    db.query(CandidateSkill).filter(CandidateSkill.candidate_id == profile.id).delete()
    for s_in in profile_in.skills:
        skill = CandidateSkill(
            candidate_id=profile.id,
            skill_name=s_in.skill_name,
            proficiency=s_in.proficiency,
            category=s_in.category or "Technical"
        )
        db.add(skill)

    db.commit()
    db.refresh(profile)
    return profile
