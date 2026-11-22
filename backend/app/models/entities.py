import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.vector_type import get_vector_column

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    match_history = relationship("MatchHistory", back_populates="user", cascade="all, delete-orphan")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_role = Column(String(255), nullable=True)
    experience_years = Column(Float, default=0.0)
    country = Column(String(100), default="India")
    state = Column(String(100), nullable=True) # e.g. Maharashtra, Karnataka
    city = Column(String(100), nullable=True)  # e.g. Pune, Bengaluru
    locality = Column(String(100), nullable=True) # e.g. Hinjewadi, Koramangala
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(String(255), nullable=True) # Human readable label
    preferred_roles = Column(JSON, default=list)  # List[str]
    preferred_locations = Column(JSON, default=list)  # List[str]
    salary_expectation = Column(Integer, nullable=True)
    min_stipend_expectation = Column(Integer, default=10000) # Minimum INR stipend for internships
    employment_preference = Column(String(50), default="Any") # Remote, Hybrid, On-site, Any
    bio = Column(Text, nullable=True)
    graduation_year = Column(Integer, nullable=True) # e.g. 2025, 2026
    degree = Column(String(100), nullable=True) # B.Tech, MCA, etc.
    embedding = Column(get_vector_column(384), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="profile")
    skills = relationship("CandidateSkill", back_populates="profile", cascade="all, delete-orphan")

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), index=True, nullable=False)
    proficiency = Column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced, Expert
    category = Column(String(50), default="Technical") # Technical, Framework, Tool, Soft Skill
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("CandidateProfile", back_populates="skills")

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), unique=True, index=True, nullable=False)
    logo_url = Column(String(512), nullable=True)
    company_type = Column(String(100), default="Startup") # Startup, MNC, Product-based, Service-based, Government, Research organization, Fintech, AI/ML startup
    headquarters = Column(String(255), default="India")
    website = Column(String(512), nullable=True)
    domain = Column(String(255), nullable=True)
    careers_url = Column(String(512), nullable=True)
    
    # MCA & Registration Authenticity
    cin = Column(String(50), nullable=True, index=True) # Corporate Identification Number
    gstin = Column(String(20), nullable=True) # GST Registration number
    mca_status = Column(String(50), default="Active") # Active, Strike Off, Under Liquidation, LLP Registered
    incorporation_year = Column(Integer, nullable=True)
    business_structure = Column(String(100), default="Private Limited") # Private Limited, Public Limited, LLP, Sole Proprietorship, Government, Registered Startup
    registered_office = Column(String(255), nullable=True)
    
    # Trust & Fraud Scoring
    trust_badge = Column(String(50), default="Verified Employer", index=True) # Verified Employer, Official Source, Verification Pending, Suspicious Activity, High Risk, Blacklisted
    trust_score = Column(Float, default=95.0) # 0-100
    fraud_risk_score = Column(Float, default=8.0) # 0-100 (Low risk)
    fraud_risk_level = Column(String(30), default="Low Risk") # Low Risk, Moderate Risk, Elevated Risk, High Risk, Critical Risk
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)

    is_verified = Column(Boolean, default=True)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    verifications = relationship("CompanyVerification", back_populates="company", cascade="all, delete-orphan")
    trust_records = relationship("CompanyTrustScores", back_populates="company", cascade="all, delete-orphan")
    recruiters = relationship("RecruiterVerification", back_populates="company", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), index=True, nullable=False)
    company = Column(String(255), index=True, nullable=False)
    company_logo = Column(String(512), nullable=True)
    company_type = Column(String(100), default="Product-based") # Startup, MNC, Product-based, Service-based, Government, Research organization, Fintech, AI/ML startup
    
    # India-first Location attributes
    country = Column(String(100), default="India", index=True) # India / International
    state = Column(String(100), index=True, nullable=True)     # Maharashtra, Karnataka, Telangana, Delhi, etc.
    city = Column(String(100), index=True, nullable=True)       # Pune, Bengaluru, Hyderabad, etc.
    locality = Column(String(100), index=True, nullable=True)   # Hinjewadi, Baner, Whitefield, etc.
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(String(255), index=True, nullable=False)  # Display string e.g. "Pune (Hinjewadi), Maharashtra"

    # Opportunity Type and Work Mode
    opportunity_type = Column(String(50), default="Internship", index=True) # Internship, Full-time, Part-time, Graduate Trainee, Research Internship
    workplace_type = Column(String(50), default="Remote") # Remote, Hybrid, On-site (compatibility)
    work_mode = Column(String(50), default="Remote", index=True) # Remote, Hybrid, On-site
    remote_details = Column(String(150), default="Work from anywhere in India") # "Work from anywhere in India", "Remote within specific states", "Remote with occasional office visits"

    # Compensation / Monthly Stipend in INR
    stipend_type = Column(String(50), default="Fixed stipend") # Fixed stipend, Performance-based stipend, Incentive-based compensation, Unpaid, Not disclosed
    stipend_amount_min = Column(Integer, nullable=True) # Monthly amount in INR (e.g. 15000)
    stipend_amount_max = Column(Integer, nullable=True) # Monthly amount in INR (e.g. 25000)
    stipend_currency = Column(String(10), default="INR")
    salary_min = Column(Integer, nullable=True) # Full-time salary compatibility
    salary_max = Column(Integer, nullable=True)
    
    # Internship Details & PPO
    duration_months = Column(Integer, default=3) # e.g. 3, 6 months
    ppo_availability = Column(String(50), default="No PPO Mentioned", index=True) # "PPO Available", "Potential PPO", "No PPO Mentioned", "Full-time Conversion Opportunity"
    ppo_terms = Column(String(255), nullable=True) # Performance review terms, conversion CTC (e.g. "₹8-12 LPA on conversion")
    ppo_eligible_criteria = Column(String(255), nullable=True) # Eligibility batch, e.g. "2025/2026 Batch Graduates"

    # Opportunity Specs
    description = Column(Text, nullable=False)
    experience_required = Column(Float, default=0.0) # Years of required experience (0 for student internships)
    employment_type = Column(String(50), default="Internship")
    required_skills = Column(JSON, default=list)  # List[str]
    preferred_skills = Column(JSON, default=list) # List[str]
    responsibilities = Column(JSON, default=list) # List[str]
    qualifications = Column(JSON, default=list)   # List[str]
    eligibility_criteria = Column(JSON, default=list) # Graduation years, min marks, degree requirements
    benefits = Column(JSON, default=list)         # List[str]
    
    # Application & Authenticity Verification
    application_url = Column(String(512), nullable=True) # Genuine employer portal URL
    source_platform = Column(String(100), default="Official Portal") # AICTE Internship Portal, NCS, PM Internship Scheme, Official Careers Page, Wellfound, Internshala, Naukri, LinkedIn Jobs
    source_url = Column(String(512), nullable=True)
    verification_status = Column(String(50), default="Verified", index=True) # 🟢 Verified, 🟡 Verification Pending, 🔴 Expired / Closed
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    application_deadline = Column(DateTime, nullable=True)
    is_expired = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    source = Column(String(100), default="direct")

    # Safety, Fraud Detection & Company Trust
    trust_badge = Column(String(50), default="Verified Employer", index=True) # Verified Employer, Official Source, Verification Pending, Suspicious Activity, High Risk, Blacklisted
    fraud_risk_score = Column(Float, default=10.0) # 0-100 (0-20 Low, 21-40 Moderate, 41-60 Elevated, 61-80 High, 81-100 Critical)
    fraud_risk_level = Column(String(30), default="Low Risk")
    is_fee_required = Column(Boolean, default=False) # High-priority scam signal (demanding money)
    is_application_blocked = Column(Boolean, default=False)
    block_reason = Column(String(255), nullable=True)
    recruiter_name = Column(String(100), nullable=True)
    recruiter_email = Column(String(150), nullable=True)
    recruiter_verification = Column(String(50), default="Verified") # Verified, Partially Verified, Unverified, Suspicious
    last_safety_audit = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Embeddings
    embedding = Column(get_vector_column(384), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    matches = relationship("MatchHistory", back_populates="job", cascade="all, delete-orphan")
    verifications = relationship("OpportunityVerification", back_populates="job", cascade="all, delete-orphan")
    fraud_assessments = relationship("FraudRiskAssessments", back_populates="job", cascade="all, delete-orphan")
    fraud_reports = relationship("FraudReports", back_populates="job", cascade="all, delete-orphan")
    safety_checks = relationship("ApplicationSafetyChecks", back_populates="job", cascade="all, delete-orphan")

class OpportunityVerification(Base):
    __tablename__ = "opportunity_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="Verified") # Verified, Verification Pending, Expired / Closed
    last_checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    check_method = Column(String(50), default="Automated URL & Expiration Validation")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    job = relationship("Job", back_populates="verifications")

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="Career Strategy Chat")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

class MatchHistory(Base):
    __tablename__ = "match_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    semantic_score = Column(Float, nullable=False)
    skill_score = Column(Float, nullable=False)
    experience_score = Column(Float, nullable=False)
    location_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)
    match_category = Column(String(50), default="Strong Match") # Excellent Match, Strong Match, Moderate Match, Low Match
    explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="match_history")
    job = relationship("Job", back_populates="matches")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=True)
    extracted_text = Column(Text, nullable=False)
    analysis_json = Column(JSON, nullable=False)
    strength_score = Column(Float, default=70.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="resume_analyses")

# =====================================================================
# SECTION 16: AI COMPANY TRUST, FRAUD DETECTION & STUDENT SAFETY MODELS
# =====================================================================

class CompanyVerification(Base):
    __tablename__ = "company_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    cin = Column(String(50), nullable=True, index=True) # Corporate Identification Number (MCA)
    mca_status = Column(String(50), default="Active")   # Active, Strike Off, Under Liquidation, LLP Registered
    incorporation_year = Column(Integer, nullable=True)
    gstin = Column(String(20), nullable=True)          # 15-digit GSTIN
    business_structure = Column(String(100), default="Private Limited") # Private Limited, Public Limited, LLP, Sole Proprietorship, Government, Registered Startup
    registered_office = Column(String(255), nullable=True)
    website_domain = Column(String(255), nullable=True)
    domain_age_years = Column(Float, default=5.0)
    has_official_career_page = Column(Boolean, default=True)
    linkedin_url = Column(String(512), nullable=True)
    verification_source = Column(String(100), default="MCA & Official Domain Records")
    is_mca_registered = Column(Boolean, default=True)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="verifications")

class CompanyTrustScores(Base):
    __tablename__ = "company_trust_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    trust_badge = Column(String(50), default="Verified Employer", index=True) # Verified Employer, Official Source, Verification Pending, Suspicious Activity, High Risk, Blacklisted
    trust_score = Column(Float, default=95.0) # 0-100
    legitimacy_score = Column(Float, default=95.0)
    transparency_score = Column(Float, default=90.0)
    reputation_score = Column(Float, default=92.0)
    signals_breakdown = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="trust_records")

class FraudRiskAssessments(Base):
    __tablename__ = "fraud_risk_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    risk_score = Column(Float, default=10.0) # 0-100 (0-20 Low, 21-40 Moderate, 41-60 Elevated, 61-80 High, 81-100 Critical)
    risk_level = Column(String(30), default="Low Risk")
    signals_evaluated = Column(JSON, default=dict) # Evaluation results across all 15 signals
    reasons = Column(JSON, default=list)           # Human-readable explanations
    red_flags = Column(JSON, default=list)         # High-priority warnings (e.g. registration fee)
    is_fee_required = Column(Boolean, default=False)
    is_suspicious_domain = Column(Boolean, default=False)
    is_recruiter_suspicious = Column(Boolean, default=False)
    assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    job = relationship("Job", back_populates="fraud_assessments")

class RecruiterVerification(Base):
    __tablename__ = "recruiter_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    recruiter_name = Column(String(100), nullable=False)
    recruiter_email = Column(String(150), nullable=True)
    email_domain = Column(String(100), nullable=True)
    is_free_email = Column(Boolean, default=False)     # e.g. @gmail.com, @yahoo.com
    is_domain_matched = Column(Boolean, default=True)  # Matches company official domain
    linkedin_profile = Column(String(512), nullable=True)
    verification_status = Column(String(50), default="Verified") # Verified, Partially Verified, Unverified, Suspicious
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="recruiters")

class SuspiciousDomains(Base):
    __tablename__ = "suspicious_domains"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    domain = Column(String(255), unique=True, index=True, nullable=False)
    reason = Column(String(255), nullable=False) # Typosquatting, phishing imitation, disposable TLD, reported scam
    target_company = Column(String(255), nullable=True)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_blocked = Column(Boolean, default=True)

class FraudReports(Base):
    __tablename__ = "fraud_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    company_name = Column(String(255), nullable=False)
    opportunity_title = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False) # fake_company, registration_fee_demand, fake_recruiter, fake_internship, fake_ppo_promise, stipend_fraud, suspicious_link, info_theft, other
    description = Column(Text, nullable=False)
    reporter_email = Column(String(150), nullable=True) # Confidential: never displayed publicly
    reporter_name = Column(String(100), nullable=True)  # Confidential
    suspicious_url = Column(String(512), nullable=True)
    evidence_urls = Column(JSON, default=list)
    credibility_score = Column(Float, default=70.0)    # 0-100 assessment score
    investigation_status = Column(String(50), default="Pending") # Pending, Under Review, Investigating, Resolved, Dismissed
    resolution_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="fraud_reports")
    evidences = relationship("FraudEvidence", back_populates="report", cascade="all, delete-orphan")

class FraudEvidence(Base):
    __tablename__ = "fraud_evidences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("fraud_reports.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), default="screenshot") # screenshot, fee_demand_message, offer_letter, chat_log
    file_url = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    report = relationship("FraudReports", back_populates="evidences")

class AdminReviews(Base):
    __tablename__ = "admin_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(50), nullable=False) # company, job, report, recruiter
    entity_id = Column(String(36), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_taken = Column(String(50), nullable=False) # verify, flag_suspicious, block, blacklist, restore, dismiss
    review_notes = Column(Text, nullable=True)
    decision_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ApplicationSafetyChecks(Base):
    __tablename__ = "application_safety_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    step_results = Column(JSON, default=dict) # Results for Steps 1-5
    recommendation = Column(String(50), default="SAFE TO PROCEED") # SAFE TO PROCEED, PROCEED WITH CAUTION, APPLICATION BLOCKED
    is_blocked = Column(Boolean, default=False)
    block_reason = Column(String(255), nullable=True)
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    job = relationship("Job", back_populates="safety_checks")

class VerificationAuditLogs(Base):
    __tablename__ = "verification_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(50), nullable=False) # company, job, recruiter, domain
    entity_id = Column(String(36), nullable=False)
    event_type = Column(String(50), nullable=False)  # automated_scan, admin_override, report_filed, status_change, scam_blocked
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    details = Column(JSON, default=dict)
    performed_by = Column(String(100), default="AI Fraud Detection Engine")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

