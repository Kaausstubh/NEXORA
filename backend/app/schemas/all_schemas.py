from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    has_profile: bool = False

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    has_profile: bool = False
    model_config = ConfigDict(from_attributes=True)

# --- Skill Schemas ---
class SkillBase(BaseModel):
    skill_name: str
    proficiency: str = "Intermediate" # Beginner, Intermediate, Advanced, Expert
    category: Optional[str] = "Technical"

class SkillCreate(SkillBase):
    pass

class SkillOut(SkillBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Profile Schemas ---
class ProfileBase(BaseModel):
    current_role: Optional[str] = None
    experience_years: float = 0.0
    country: Optional[str] = "India"
    state: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    preferred_roles: List[str] = []
    preferred_locations: List[str] = []
    salary_expectation: Optional[int] = None
    min_stipend_expectation: Optional[int] = 10000
    employment_preference: Optional[str] = "Any"
    bio: Optional[str] = None
    graduation_year: Optional[int] = None
    degree: Optional[str] = None

class ProfileCreate(ProfileBase):
    skills: List[SkillCreate] = []

class ProfileUpdate(ProfileBase):
    skills: Optional[List[SkillCreate]] = None

class ProfileOut(ProfileBase):
    id: str
    user_id: str
    skills: List[SkillOut] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Job Schemas ---
class JobBase(BaseModel):
    title: str
    company: str
    company_logo: Optional[str] = None
    company_type: Optional[str] = "Product-based"
    description: str
    location: str
    country: Optional[str] = "India"
    state: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    workplace_type: str = "Remote" # Remote, Hybrid, On-site
    work_mode: Optional[str] = "Remote" # Remote, On-site, Hybrid
    remote_details: Optional[str] = "Work from anywhere in India"
    opportunity_type: Optional[str] = "Internship" # Internship, Full-time, etc.
    stipend_type: Optional[str] = "Fixed stipend" # Fixed stipend, Performance-based stipend, Incentive-based compensation, Unpaid, Not disclosed
    stipend_amount_min: Optional[int] = None
    stipend_amount_max: Optional[int] = None
    stipend_currency: Optional[str] = "INR"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    duration_months: Optional[int] = 3
    ppo_availability: Optional[str] = "No PPO Mentioned" # PPO Available, Potential PPO, No PPO Mentioned, Full-time Conversion Opportunity
    ppo_terms: Optional[str] = None
    ppo_eligible_criteria: Optional[str] = None
    experience_required: float = 0.0
    employment_type: str = "Internship"
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    qualifications: List[str] = []
    eligibility_criteria: List[str] = []
    benefits: List[str] = []
    application_url: Optional[str] = None
    source_platform: Optional[str] = "Official Portal"
    source_url: Optional[str] = None
    verification_status: Optional[str] = "Verified" # Verified, Verification Pending, Expired / Closed
    verified_at: Optional[datetime] = None
    application_deadline: Optional[datetime] = None
    is_expired: Optional[bool] = False
    is_demo: bool = False
    trust_badge: Optional[str] = "Verified Employer" # Verified Employer, Official Source, Verification Pending, Suspicious Activity, High Risk, Blacklisted
    fraud_risk_score: Optional[int] = 10 # 0-100
    fraud_risk_level: Optional[str] = "Low Risk" # Low Risk, Moderate Risk, Elevated Risk, High Risk, Critical Risk
    is_fee_required: Optional[bool] = False # True = scam trigger
    is_application_blocked: Optional[bool] = False
    block_reason: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    recruiter_verification: Optional[str] = "Verified" # Verified, Partially Verified, Unverified, Suspicious
    last_safety_audit: Optional[datetime] = None

class JobCreate(JobBase):
    pass

class JobOut(JobBase):
    id: str
    created_at: datetime
    match_score: Optional[float] = None
    match_explanation: Optional[str] = None
    match_tier: Optional[str] = None # Excellent Match, Strong Match, Moderate Match, Low Match
    is_saved: Optional[bool] = False
    distance_km: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class JobFilter(BaseModel):
    query: Optional[str] = None
    role: Optional[str] = None
    country: Optional[str] = "India"
    city: Optional[str] = None
    state: Optional[str] = None
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    location: Optional[str] = None
    workplace_type: Optional[str] = None
    work_modes: Optional[List[str]] = None
    employment_type: Optional[str] = None
    opportunity_type: Optional[str] = None
    min_stipend: Optional[int] = None
    max_stipend: Optional[int] = None
    stipend_type: Optional[str] = None
    ppo_filter: Optional[str] = None
    company_type: Optional[str] = None
    verification_status: Optional[str] = None
    min_salary: Optional[int] = None
    max_experience: Optional[float] = None
    skills: Optional[List[str]] = None
    sort_by: Optional[str] = "relevance" # nearest, stipend_high, relevance, newest, deadline, ppo_first
    page: int = 1
    page_size: int = 12

class JobListResponse(BaseModel):
    items: List[JobOut]
    total: int
    page: int
    page_size: int
    total_pages: int

# --- Matching Schemas ---
class MatchExplanation(BaseModel):
    why_match: str
    why_not_perfect: str
    matched_skills: List[str]
    missing_skills: List[str]
    career_advantage: Optional[str] = None
    eligibility_fit: Optional[str] = None
    improvement_recommendation: Optional[str] = None

class MatchBreakdown(BaseModel):
    semantic_score: float
    skill_score: float
    experience_score: float
    location_score: float
    final_score: float
    weights: Dict[str, float]

class SmartMatchOut(BaseModel):
    job: JobOut
    breakdown: MatchBreakdown
    explanation: MatchExplanation
    tier: str # Excellent Match (85-100), Strong Match (70-84), Moderate Match (50-69), Low Match (<50)

class SmartMatchesResponse(BaseModel):
    excellent_matches: List[SmartMatchOut] = []
    strong_matches: List[SmartMatchOut] = []
    moderate_matches: List[SmartMatchOut] = []
    low_matches: List[SmartMatchOut] = []
    # Backwards compatibility
    best_matches: List[SmartMatchOut] = []
    potential_matches: List[SmartMatchOut] = []
    total_evaluated: int

# --- Skill Gap Schemas ---
class SkillGapItem(BaseModel):
    skill_name: str
    status: str # matched, missing_required, missing_preferred
    importance: str # Critical, High, Medium, Nice-to-have
    learning_resource_hint: Optional[str] = None

class SkillGapAnalysisResponse(BaseModel):
    target_role_or_job: str
    overall_compatibility: float
    matched_count: int
    missing_count: int
    skills: List[SkillGapItem]
    learning_priorities: List[str]
    ai_guidance: str

# --- Agent / Conversation Schemas ---
class ChatMessageCreate(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: Optional[Any] = None
    created_at: datetime

class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []
    model_config = ConfigDict(from_attributes=True)

# --- Resume Analysis Schemas ---
class ResumeAnalysisOut(BaseModel):
    id: str
    original_filename: Optional[str]
    strength_score: float
    skills_extracted: List[str]
    experience_summary: str
    recommended_improvements: List[str]
    suitable_job_categories: List[str]
    raw_analysis: Dict[str, Any]
    created_at: datetime

# --- Dashboard Analytics ---
class DashboardOverview(BaseModel):
    profile_completion: int # 0 to 100%
    total_matching_jobs: int
    average_match_score: float
    saved_opportunities_count: int
    top_recommended_jobs: List[JobOut]
    recent_jobs: List[JobOut]
    top_matching_companies: List[Dict[str, Any]]
    skill_demand: List[Dict[str, Any]]
    career_insights: List[Dict[str, str]]

# --- Feature 16: AI Fraud Detection & Safety Schemas ---
class SafetyCheckStep(BaseModel):
    step_number: int
    title: str
    status: str # passed, warning, failed
    detail: str

class ApplicationSafetyCheckOut(BaseModel):
    job_id: str
    opportunity_title: str
    company_name: str
    verdict: str # SAFE TO PROCEED, PROCEED WITH CAUTION, APPLICATION BLOCKED
    verdict_color: str # emerald, amber, red
    is_blocked: bool
    block_reason: Optional[str] = None
    steps: List[SafetyCheckStep] = []
    trust_badge: str
    fraud_risk_score: int
    fraud_risk_level: str
    fee_required: bool = False
    recruiter_verification: str = "Verified"
    destination_url: Optional[str] = None
    is_destination_trusted: bool = True
    safety_tips: List[str] = []

class CompanyTrustDetailsOut(BaseModel):
    id: str
    name: str
    cin: Optional[str] = None
    gstin: Optional[str] = None
    mca_status: Optional[str] = "Active"
    incorporation_year: Optional[int] = None
    business_structure: Optional[str] = "Private Limited (Pvt Ltd)"
    registered_office: Optional[str] = None
    website: Optional[str] = None
    domain: Optional[str] = None
    domain_age_years: Optional[float] = 5.0
    domain_security_score: Optional[int] = 95
    trust_badge: str = "Verified Employer"
    trust_score: int = 85
    fraud_risk_score: int = 10
    fraud_risk_level: str = "Low Risk"
    is_blacklisted: bool = False
    blacklist_reason: Optional[str] = None
    verification_source: Optional[str] = "MCA / Ministry of Corporate Affairs records"
    recruiter_verification_status: Optional[str] = "Verified"
    risk_factors: List[str] = []
    trust_factors: List[str] = []
    cert_in_advisory: Dict[str, str] = {}
    cybercrime_helpline: Dict[str, str] = {}

class RecruiterVerificationOut(BaseModel):
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    domain: Optional[str] = None
    verification_status: str # Verified, Partially Verified, Unverified, Suspicious
    is_public_free_email: bool = False
    is_domain_matched: bool = True
    details: str

class FraudReportCreate(BaseModel):
    job_id: Optional[str] = None
    company_name: str
    opportunity_title: Optional[str] = None
    reported_category: str # Registration / Training Fee Demanded, Fake Company / Phishing, Fake Recruiter Email, Fraudulent PPO Promise, Suspicious Payment Demand, Other Scam Indicator
    amount_demanded: Optional[int] = None
    description: str
    evidence_urls: List[str] = []
    recruiter_contact: Optional[str] = None
    anonymous: bool = True

class FraudReportOut(BaseModel):
    id: str
    job_id: Optional[str] = None
    company_name: str
    opportunity_title: Optional[str] = None
    reported_category: str
    amount_demanded: Optional[int] = None
    description: str
    evidence_urls: List[str] = []
    status: str # Submitted, Under Review, Verified Scam, Dismissed
    created_at: datetime
    moderation_notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AdminReviewCreate(BaseModel):
    target_type: str # company, job, report
    target_id: str
    action: str # verify, block, blacklist, restore, dismiss_report
    decision_reason: str
    assigned_trust_badge: Optional[str] = None
    assigned_risk_score: Optional[int] = None

class AdminFraudDashboardOut(BaseModel):
    total_verified_companies: int
    pending_verifications: int
    high_risk_opportunities: int
    blocked_scams_count: int
    suspicious_domains_count: int
    pending_fraud_reports_count: int
    recent_fraud_reports: List[FraudReportOut] = []
    flagged_jobs: List[JobOut] = []
    audit_logs: List[Dict[str, Any]] = []
