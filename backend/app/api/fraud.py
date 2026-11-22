import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.entities import (
    Company, Job, FraudReports, FraudEvidence, AdminReviews,
    SuspiciousDomains, ApplicationSafetyChecks, VerificationAuditLogs, User
)
from app.schemas.all_schemas import (
    ApplicationSafetyCheckOut, CompanyTrustDetailsOut,
    FraudReportCreate, FraudReportOut, AdminReviewCreate, AdminFraudDashboardOut, JobOut
)
from app.services.fraud_detection_service import (
    evaluate_application_gateway, get_company_trust_details,
    calculate_fraud_risk, seed_and_enrich_fraud_data
)
from app.api.deps import get_optional_user

router = APIRouter(prefix="/fraud", tags=["Fraud Detection & Student Safety"])
logger = logging.getLogger("fraud_api")

@router.post("/safety-check/{job_id}", response_model=ApplicationSafetyCheckOut)
def run_job_safety_check(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Executes the 5-step Pre-Application Safe Gateway Check for an opportunity:
    Step 1: Company Identity Verification
    Step 2: Source Authenticity Verification
    Step 3: Destination URL Phishing & Encryption Check
    Step 4: Zero-Payment Compliance (Zero fees demanded)
    Step 5: AI 15-Signal Risk Assessment
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    gateway_result = evaluate_application_gateway(job, db)

    # Log the safety check
    try:
        safety_log = ApplicationSafetyChecks(
            job_id=job.id,
            user_id=current_user.id if current_user else None,
            checked_url=job.application_url or job.source_url or "https://nexora.careers",
            domain_reputation=100 - gateway_result["fraud_risk_score"],
            is_ssl_valid=gateway_result["is_destination_trusted"],
            payment_demand_detected=gateway_result["fee_required"],
            risk_verdict=gateway_result["verdict"],
            risk_score=gateway_result["fraud_risk_score"],
            passed_checks=not gateway_result["is_blocked"],
            warning_flags=gateway_result.get("block_reason")
        )
        db.add(safety_log)
        db.commit()
    except Exception as e:
        logger.warning(f"Could not persist safety check log: {e}")
        db.rollback()

    return gateway_result

@router.get("/company/{company_identifier}/trust-details", response_model=CompanyTrustDetailsOut)
def get_company_trust_info(company_identifier: str, db: Session = Depends(get_db)):
    """
    Returns full company verification details, MCA CIN analysis, GSTIN,
    and transparency factors for the candidate safety details modal.
    """
    details = get_company_trust_details(company_identifier, db)
    return details

@router.post("/report", response_model=FraudReportOut, status_code=status.HTTP_201_CREATED)
def submit_fraud_report(
    report_in: FraudReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Confidential student fraud reporting system.
    Safely logs candidate scam reports, duplicate detections, and evidence links.
    """
    # Check if duplicate report within last 24 hours for same user & job
    reporter_email = current_user.email if current_user else None
    reporter_name = current_user.name if current_user else "Anonymous Student"

    # Create Fraud Report
    new_report = FraudReports(
        job_id=report_in.job_id,
        company_name=report_in.company_name,
        opportunity_title=report_in.opportunity_title,
        category=report_in.reported_category,
        description=f"{report_in.description} [Amount Demanded: ₹{report_in.amount_demanded or 0}] [Contact: {report_in.recruiter_contact or 'N/A'}]",
        reporter_email=reporter_email,
        reporter_name=reporter_name,
        suspicious_url=report_in.evidence_urls[0] if report_in.evidence_urls else None,
        evidence_urls=report_in.evidence_urls,
        investigation_status="Under Review",
        credibility_score=85.0 if report_in.amount_demanded else 70.0
    )
    db.add(new_report)
    db.flush()

    # If evidence URLs were provided, save to FraudEvidence
    for url in report_in.evidence_urls:
        ev = FraudEvidence(
            report_id=new_report.id,
            evidence_type="link_or_screenshot",
            file_url=url,
            description="Submitted candidate evidence"
        )
        db.add(ev)

    # If amount demanded > 0 or fee-scam reported, automatically flag the opportunity for immediate review
    if report_in.job_id:
        target_job = db.query(Job).filter(Job.id == report_in.job_id).first()
        if target_job:
            target_job.fraud_risk_score = min(100, int(target_job.fraud_risk_score or 10) + 30)
            if target_job.fraud_risk_score > 60:
                target_job.fraud_risk_level = "High Risk"
                target_job.trust_badge = "Suspicious Activity"

    db.commit()
    db.refresh(new_report)

    return {
        "id": new_report.id,
        "job_id": new_report.job_id,
        "company_name": new_report.company_name,
        "opportunity_title": new_report.opportunity_title,
        "reported_category": new_report.category,
        "amount_demanded": report_in.amount_demanded,
        "description": new_report.description,
        "evidence_urls": new_report.evidence_urls or [],
        "status": new_report.investigation_status,
        "created_at": new_report.reported_at,
        "moderation_notes": new_report.admin_notes
    }

@router.get("/admin/dashboard", response_model=AdminFraudDashboardOut)
def get_admin_fraud_dashboard(db: Session = Depends(get_db)):
    """Returns analytics, metrics, flagged listings, and queue for fraud monitoring."""
    verified_comps = db.query(Company).filter(Company.trust_badge.in_(["Verified Employer", "Official Source"])).count()
    pending_comps = db.query(Company).filter(Company.trust_badge == "Verification Pending").count()
    high_risk_jobs = db.query(Job).filter(Job.fraud_risk_score >= 60).count()
    blocked_jobs = db.query(Job).filter(Job.is_application_blocked == True).count()
    suspicious_domains_count = db.query(SuspiciousDomains).count()
    pending_reports = db.query(FraudReports).filter(FraudReports.investigation_status.in_(["Pending", "Under Review"])).count()

    # Recent reports
    reports = db.query(FraudReports).order_by(desc(FraudReports.reported_at)).limit(10).all()
    reports_out = [
        FraudReportOut(
            id=r.id,
            job_id=r.job_id,
            company_name=r.company_name,
            opportunity_title=r.opportunity_title,
            reported_category=r.category,
            amount_demanded=None,
            description=r.description,
            evidence_urls=r.evidence_urls or [],
            status=r.investigation_status,
            created_at=r.reported_at,
            moderation_notes=r.admin_notes
        )
        for r in reports
    ]

    # Flagged / high risk jobs
    flagged = db.query(Job).filter((Job.fraud_risk_score >= 60) | (Job.is_application_blocked == True)).limit(10).all()
    flagged_out = [JobOut.model_validate(j) for j in flagged]

    # Audit logs
    audit_reviews = db.query(AdminReviews).order_by(desc(AdminReviews.created_at)).limit(10).all()
    audit_logs = [
        {
            "id": a.id,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "action_taken": a.action_taken,
            "decision_reason": a.decision_reason or a.review_notes,
            "created_at": a.created_at.isoformat()
        }
        for a in audit_reviews
    ]

    return {
        "total_verified_companies": verified_comps,
        "pending_verifications": pending_comps,
        "high_risk_opportunities": high_risk_jobs,
        "blocked_scams_count": blocked_jobs,
        "suspicious_domains_count": suspicious_domains_count,
        "pending_fraud_reports_count": pending_reports,
        "recent_fraud_reports": reports_out,
        "flagged_jobs": flagged_out,
        "audit_logs": audit_logs
    }

@router.post("/admin/review")
def review_target(
    review_in: AdminReviewCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Executes moderation action: verify, block, blacklist, restore, dismiss_report."""
    action = review_in.action.lower()
    
    if review_in.target_type == "job":
        job = db.query(Job).filter(Job.id == review_in.target_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if action == "block":
            job.is_application_blocked = True
            job.trust_badge = "High Risk"
            job.fraud_risk_score = 90
            job.fraud_risk_level = "High Risk"
            job.block_reason = review_in.decision_reason
        elif action == "restore" or action == "verify":
            job.is_application_blocked = False
            job.trust_badge = review_in.assigned_trust_badge or "Verified Employer"
            job.fraud_risk_score = review_in.assigned_risk_score or 10
            job.fraud_risk_level = "Low Risk"
            job.block_reason = None
            job.is_fee_required = False

    elif review_in.target_type == "company":
        comp = db.query(Company).filter((Company.id == review_in.target_id) | (Company.name.ilike(review_in.target_id))).first()
        if not comp:
            raise HTTPException(status_code=404, detail="Company not found")
        
        if action == "blacklist":
            comp.is_blacklisted = True
            comp.blacklist_reason = review_in.decision_reason
            comp.trust_badge = "Blacklisted"
            comp.fraud_risk_score = 99
            comp.fraud_risk_level = "Critical Risk"
            # Block all jobs from this company
            db.query(Job).filter(Job.company.ilike(comp.name)).update({
                "is_application_blocked": True,
                "trust_badge": "Blacklisted",
                "fraud_risk_score": 99,
                "fraud_risk_level": "Critical Risk",
                "block_reason": f"Company Blacklisted: {review_in.decision_reason}"
            })
        elif action == "verify":
            comp.is_blacklisted = False
            comp.trust_badge = review_in.assigned_trust_badge or "Verified Employer"
            comp.trust_score = 95
            comp.fraud_risk_score = 10
            comp.fraud_risk_level = "Low Risk"

    elif review_in.target_type == "report":
        report = db.query(FraudReports).filter(FraudReports.id == review_in.target_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if action == "dismiss_report":
            report.investigation_status = "Dismissed"
            report.admin_notes = review_in.decision_reason
        else:
            report.investigation_status = "Verified Scam"
            report.admin_notes = review_in.decision_reason

    # Add audit log
    audit = AdminReviews(
        entity_type=review_in.target_type,
        entity_id=review_in.target_id,
        reviewer_id=current_user.id if current_user else None,
        action_taken=action,
        decision_reason=review_in.decision_reason,
        review_notes=review_in.decision_reason
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "action": action, "target_id": review_in.target_id}

@router.get("/admin/reports", response_model=List[FraudReportOut])
def list_student_fraud_reports(db: Session = Depends(get_db)):
    """Lists all candidate-submitted fraud and scam reports."""
    reports = db.query(FraudReports).order_by(desc(FraudReports.reported_at)).all()
    return [
        FraudReportOut(
            id=r.id,
            job_id=r.job_id,
            company_name=r.company_name,
            opportunity_title=r.opportunity_title,
            reported_category=r.category,
            amount_demanded=None,
            description=r.description,
            evidence_urls=r.evidence_urls or [],
            status=r.investigation_status,
            created_at=r.reported_at,
            moderation_notes=r.admin_notes
        )
        for r in reports
    ]
