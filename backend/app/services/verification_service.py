import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from app.models.entities import Job, OpportunityVerification

# Known authentic domains for verified Indian employers and government portals
AUTHENTIC_DOMAINS = {
    # Government & Official Portals
    "aicte-india.org",
    "internship.aicte-india.org",
    "ncs.gov.in",
    "pminternship.mca.gov.in",
    "drdo.gov.in",
    "isro.gov.in",
    # Global Tech MNCs in India
    "careers.google.com",
    "google.com",
    "careers.microsoft.com",
    "microsoft.com",
    "amazon.jobs",
    "nvidia.com",
    "qualcomm.com",
    "salesforce.com",
    "adobe.com",
    # Indian Startups & Unicorns
    "flipkartcareers.com",
    "flipkart.com",
    "phonepe.com",
    "razorpay.com",
    "zomato.com",
    "swiggy.com",
    "meesho.io",
    "meesho.com",
    "cred.club",
    "zoho.com",
    "freshworks.com",
    "postman.com",
    "inmobi.com",
    "groww.in",
    "zerodha.com",
    # Indian IT & Professional Services
    "tcs.com",
    "infosys.com",
    "wipro.com",
    "accenture.com",
    "deloitte.com",
    # Authorized Platforms
    "wellfound.com",
    "internshala.com",
    "naukri.com",
    "linkedin.com"
}

class VerificationEngine:
    """
    Automated verification engine for real-time India-first opportunities.
    Validates employer domains, deadlines, and duplicate records.
    """

    def is_authentic_domain(self, url: Optional[str]) -> bool:
        if not url:
            return False
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            
            # Check direct or subdomain match
            for auth in AUTHENTIC_DOMAINS:
                if domain == auth or domain.endswith("." + auth):
                    return True
            return False
        except Exception:
            return False

    def verify_job(self, db: Session, job: Job) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        notes = []

        # 1. Deadline check
        if job.application_deadline:
            # Handle timezone-aware vs naive
            deadline = job.application_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            
            if now > deadline:
                job.is_expired = True
                job.verification_status = "Expired / Closed"
                notes.append(f"Application deadline ({job.application_deadline.strftime('%Y-%m-%d')}) has passed.")
            else:
                job.is_expired = False

        # 2. Domain & Application URL check
        if not job.is_expired:
            url_to_check = job.application_url or job.source_url
            if url_to_check and self.is_authentic_domain(url_to_check):
                job.verification_status = "Verified"
                notes.append("Application URL validated against verified employer/portal domain list.")
            elif url_to_check:
                job.verification_status = "Verification Pending"
                notes.append("Opportunity under manual editorial review for employer authenticity.")
            else:
                job.verification_status = "Verification Pending"
                notes.append("No direct application link provided.")

        job.verified_at = now

        # Record audit log in OpportunityVerification table
        audit_record = OpportunityVerification(
            job_id=job.id,
            status=job.verification_status,
            check_method="Automated Domain & Deadline Validation",
            notes="; ".join(notes),
            is_active=not job.is_expired
        )
        db.add(audit_record)
        db.commit()

        return {
            "job_id": job.id,
            "status": job.verification_status,
            "is_expired": job.is_expired,
            "verified_at": job.verified_at,
            "notes": notes
        }

    def run_batch_verification(self, db: Session) -> Dict[str, int]:
        jobs = db.query(Job).all()
        verified_count = 0
        pending_count = 0
        expired_count = 0

        for job in jobs:
            res = self.verify_job(db, job)
            if res["status"] == "Verified":
                verified_count += 1
            elif res["status"] == "Expired / Closed":
                expired_count += 1
            else:
                pending_count += 1

        return {
            "total_evaluated": len(jobs),
            "verified": verified_count,
            "pending": pending_count,
            "expired": expired_count
        }

    def deduplicate_opportunities(self, db: Session) -> int:
        """
        Merges duplicate listings having identical normalized title and company in the same city.
        """
        all_jobs = db.query(Job).all()
        seen = {}
        merged_count = 0

        for job in all_jobs:
            key = f"{job.company.lower().strip()}_{job.title.lower().strip()}_{(job.city or '').lower().strip()}"
            if key in seen:
                # Duplicate detected: keep the one with official/verified link
                existing = seen[key]
                if existing.source_platform in ["AICTE Internship Portal", "NCS", "PM Internship Scheme"] or existing.application_url:
                    db.delete(job)
                else:
                    db.delete(existing)
                    seen[key] = job
                merged_count += 1
            else:
                seen[key] = job

        db.commit()
        return merged_count

verification_service = VerificationEngine()
