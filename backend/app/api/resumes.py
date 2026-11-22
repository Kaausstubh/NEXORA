from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, ResumeAnalysis, CandidateProfile, CandidateSkill
from app.schemas.all_schemas import ResumeAnalysisOut
from app.api.deps import get_current_user
from app.services.resume_service import resume_service
from app.services.embedding_service import embedding_service

router = APIRouter(prefix="/resumes", tags=["Resume Intelligence"])

@router.post("/upload", response_model=ResumeAnalysisOut)
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename or "resume.pdf"
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    supported_extensions = ["pdf", "docx", "doc", "txt", "text", "md"]
    
    if ext not in supported_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format (.{ext}). Supported formats: PDF (.pdf), Word (.docx, .doc), and Text (.txt)."
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    try:
        extracted_text = resume_service.extract_text(content, filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not extract text from {ext.upper()} document: {str(e)}")

    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail=f"Could not detect sufficient readable text in the uploaded {ext.upper()} document. Please ensure the document is not an empty or scanned image file."
        )

    analysis = resume_service.analyze_resume_text(extracted_text)

    # Save record
    record = ResumeAnalysis(
        user_id=current_user.id,
        original_filename=file.filename,
        extracted_text=extracted_text[:10000],
        analysis_json=analysis,
        strength_score=analysis.get("strength_score", 70.0)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ResumeAnalysisOut(
        id=record.id,
        original_filename=record.original_filename,
        strength_score=record.strength_score,
        skills_extracted=analysis.get("skills", []),
        experience_summary=analysis.get("experience_summary", ""),
        recommended_improvements=analysis.get("recommended_improvements", []),
        suitable_job_categories=analysis.get("suitable_job_categories", []),
        raw_analysis=analysis,
        created_at=record.created_at
    )

@router.post("/{analysis_id}/apply-to-profile")
async def apply_resume_to_profile(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis_rec = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.id == analysis_id,
        ResumeAnalysis.user_id == current_user.id
    ).first()
    if not analysis_rec:
        raise HTTPException(status_code=404, detail="Resume analysis record not found.")

    data = analysis_rec.analysis_json
    skills = data.get("skills", [])
    exp_years = float(data.get("estimated_years_experience", 2.0))
    role = data.get("candidate_role", "Software Engineer")
    categories = data.get("suitable_job_categories", [role])

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()

    # Generate embedding
    text_repr = embedding_service.build_candidate_text(
        current_role=role,
        experience_years=exp_years,
        preferred_roles=categories,
        skills=skills,
        bio=data.get("experience_summary", "")
    )
    vec = await embedding_service.generate_embedding(text_repr)

    if not profile:
        profile = CandidateProfile(
            user_id=current_user.id,
            current_role=role,
            experience_years=exp_years,
            location="Remote",
            preferred_roles=categories,
            preferred_locations=["Remote"],
            bio=data.get("experience_summary", ""),
            embedding=vec
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        profile.current_role = role
        profile.experience_years = exp_years
        profile.preferred_roles = categories
        profile.bio = data.get("experience_summary", "")
        profile.embedding = vec

    # Update skills
    db.query(CandidateSkill).filter(CandidateSkill.candidate_id == profile.id).delete()
    for s_name in skills:
        sk = CandidateSkill(
            candidate_id=profile.id,
            skill_name=s_name,
            proficiency="Advanced",
            category="Technical"
        )
        db.add(sk)

    db.commit()
    return {"message": "Candidate profile successfully synchronized with resume intelligence.", "profile_id": profile.id}

@router.get("/history", response_model=List[ResumeAnalysisOut])
def get_resume_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).all()
    out = []
    for r in records:
        data = r.analysis_json
        out.append(ResumeAnalysisOut(
            id=r.id,
            original_filename=r.original_filename,
            strength_score=r.strength_score,
            skills_extracted=data.get("skills", []),
            experience_summary=data.get("experience_summary", ""),
            recommended_improvements=data.get("recommended_improvements", []),
            suitable_job_categories=data.get("suitable_job_categories", []),
            raw_analysis=data,
            created_at=r.created_at
        ))
    return out
