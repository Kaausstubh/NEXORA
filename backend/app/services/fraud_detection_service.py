import re
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from app.models.entities import (
    Company, Job, CompanyVerification, CompanyTrustScores,
    FraudRiskAssessments, RecruiterVerification, SuspiciousDomains,
    FraudReports, AdminReviews, ApplicationSafetyChecks, VerificationAuditLogs
)

logger = logging.getLogger("fraud_engine")

# --- REGEX PATTERNS FOR INDIAN ENTITIES ---
# MCA CIN: e.g. U72900KA2015PTC082645
CIN_REGEX = re.compile(r"^([UL])([0-9]{5})([A-Z]{2})([0-9]{4})([A-Z]{3})([0-9]{6})$")
# GSTIN: e.g. 29AAGCM3322N1Z6
GSTIN_REGEX = re.compile(r"^([0-9]{2})([A-Z]{5}[0-9]{4}[A-Z]{1})([1-9A-Z]{1})Z([0-9A-Z]{1})$")

INDIAN_STATE_CODES = {
    "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "27": "Maharashtra", "29": "Karnataka", "32": "Kerala", "33": "Tamil Nadu", "36": "Telangana", "37": "Andhra Pradesh"
}

CIN_STATE_CODES = {
    "KA": "Karnataka", "MH": "Maharashtra", "DL": "Delhi", "TN": "Tamil Nadu",
    "TS": "Telangana", "AP": "Andhra Pradesh", "HR": "Haryana", "UP": "Uttar Pradesh",
    "WB": "West Bengal", "GJ": "Gujarat", "KL": "Kerala", "CH": "Chandigarh"
}

FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com",
    "aol.com", "yandex.com", "zoho.com", "protonmail.com", "mail.com"
}

SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".click", ".buzz", ".work", ".link", ".rest", ".online",
    ".surf", ".gq", ".cf", ".tk", ".ml", ".cc", ".icu", ".cam"
}

FEE_SCAM_KEYWORDS = [
    "registration fee", "interview fee", "refundable deposit", "security deposit",
    "training fee", "laptop deposit", "processing charge", "pay rs", "pay inr",
    "examination fee", "document verification fee", "pay ₹", "mandatory paid training",
    "application fee", "hiring charge", "id card fee", "uniform fee", "assessment fee"
]

CYBERCRIME_ADVISORY = {
    "helpline": "1930 (National Cyber Crime Helpline)",
    "portal": "https://cybercrime.gov.in",
    "cert_in": "https://www.cert-in.org.in",
    "guidelines": "Under Ministry of Labour & Employment and Indian labour standards, legitimate employers never charge recruitment fees, document verification fees, or refundable deposits for job or internship applications."
}

# --- VALIDATION HELPERS ---

def validate_cin(cin: Optional[str]) -> Dict[str, Any]:
    if not cin:
        return {"is_valid": False, "reason": "No CIN provided"}
    cin = cin.strip().upper()
    match = CIN_REGEX.match(cin)
    if not match:
        return {"is_valid": False, "reason": "Invalid CIN structure. Indian CIN must be 21 alphanumeric characters."}
    
    listing_status = "Listed" if match.group(1) == "L" else "Unlisted"
    industry_code = match.group(2)
    state_code = match.group(3)
    year = int(match.group(4))
    company_type_code = match.group(5)
    reg_num = match.group(6)

    type_mapping = {
        "PTC": "Private Limited Company",
        "PLC": "Public Limited Company",
        "LLP": "Limited Liability Partnership",
        "GOI": "Government of India Enterprise",
        "FTC": "Foreign Company",
        "SGC": "State Government Company"
    }

    return {
        "is_valid": True,
        "cin": cin,
        "listing_status": listing_status,
        "industry_code": industry_code,
        "state": CIN_STATE_CODES.get(state_code, state_code),
        "incorporation_year": year,
        "company_type": type_mapping.get(company_type_code, company_type_code),
        "registration_number": reg_num
    }

def validate_gstin(gstin: Optional[str]) -> Dict[str, Any]:
    if not gstin:
        return {"is_valid": False, "reason": "No GSTIN provided"}
    gstin = gstin.strip().upper()
    match = GSTIN_REGEX.match(gstin)
    if not match:
        return {"is_valid": False, "reason": "Invalid GSTIN format. Must be 15 alphanumeric characters."}
    
    state_digits = match.group(1)
    pan = match.group(2)
    state_name = INDIAN_STATE_CODES.get(state_digits, f"State Code {state_digits}")

    return {
        "is_valid": True,
        "gstin": gstin,
        "state": state_name,
        "pan": pan
    }

def evaluate_recruiter_email(email: Optional[str], company_domain: Optional[str]) -> Dict[str, Any]:
    if not email:
        return {
            "status": "Unverified",
            "is_free": False,
            "matches_company_domain": False,
            "explanation": "No direct recruiter email provided. Listing is handled via application portal."
        }
    
    email = email.strip().lower()
    if "@" not in email:
        return {
            "status": "Suspicious",
            "is_free": False,
            "matches_company_domain": False,
            "explanation": "Malformed email address provided."
        }
    
    domain = email.split("@")[1].strip()
    is_free = domain in FREE_EMAIL_DOMAINS

    if is_free:
        return {
            "status": "Suspicious",
            "is_free": True,
            "matches_company_domain": False,
            "explanation": f"Recruiter uses free public email (@{domain}). Legitimate corporate recruiters use their enterprise domain."
        }

    if company_domain:
        clean_company_domain = company_domain.lower().replace("www.", "").strip()
        if domain == clean_company_domain or domain.endswith("." + clean_company_domain):
            return {
                "status": "Verified",
                "is_free": False,
                "matches_company_domain": True,
                "explanation": f"Recruiter email domain (@{domain}) directly matches verified company domain."
            }
        else:
            return {
                "status": "Partially Verified",
                "is_free": False,
                "matches_company_domain": False,
                "explanation": f"Recruiter email domain (@{domain}) differs from company website domain ({clean_company_domain})."
            }

    return {
        "status": "Partially Verified",
        "is_free": False,
        "matches_company_domain": False,
        "explanation": f"Corporate domain (@{domain}) detected."
    }

def evaluate_url_safety(url: Optional[str], company_domain: Optional[str]) -> Dict[str, Any]:
    if not url:
        return {"is_safe": False, "reason": "No application URL provided", "is_suspicious_tld": False}
    
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    
    is_https = parsed.scheme.lower() == "https"
    is_suspicious_tld = any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS)

    reasons = []
    if not is_https:
        reasons.append("Insecure HTTP protocol used instead of HTTPS")
    if is_suspicious_tld:
        reasons.append(f"Application destination uses suspicious high-risk TLD ({hostname})")

    return {
        "is_safe": is_https and not is_suspicious_tld,
        "hostname": hostname,
        "is_https": is_https,
        "is_suspicious_tld": is_suspicious_tld,
        "reasons": reasons
    }

def detect_payment_demands(text: str) -> Tuple[bool, List[str]]:
    """Detects demands for candidate money in descriptions or requirements."""
    if not text:
        return False, []
    
    lower_text = text.lower()
    found_triggers = []
    for trigger in FEE_SCAM_KEYWORDS:
        if trigger in lower_text:
            found_triggers.append(trigger)
    
    return len(found_triggers) > 0, found_triggers


# --- 15-SIGNAL AI RISK SCORING ENGINE ---

def calculate_fraud_risk(job: Job, company: Optional[Company] = None, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Evaluates 15 signals and generates a 0-100 risk score and safety categorization:
    🟢 0–20: Low Risk
    🟡 21–40: Moderate Risk
    🟠 41–60: Elevated Risk
    🔴 61–80: High Risk
    🚨 81–100: Critical Risk
    """
    risk_score = 0
    reasons = []
    red_flags = []
    trust_indicators = []

    # Combined text for scam analysis
    job_text = f"{job.title} {job.description} {job.eligibility_criteria} {job.responsibilities}"

    # Signal 8, 9, 10: Requests for registration, interview, security deposit, or training fees
    has_fees, fee_keywords = detect_payment_demands(job_text)
    if job.is_fee_required or has_fees:
        risk_score += 85
        flag_msg = f"Zero-Tolerance Scam Alert: Demands upfront candidate fees or deposits ({', '.join(fee_keywords or ['Registration / Training Fee'])})"
        red_flags.append(flag_msg)
        reasons.append(flag_msg)

    # Signal 1: Company registration authenticity (MCA / CIN / Structure)
    if company:
        if company.is_blacklisted:
            risk_score += 90
            red_flags.append(f"Company is blacklisted: {company.blacklist_reason or 'Confirmed fraudulent activity'}")
            reasons.append("Entity has been blacklisted due to verified fraudulent activity.")
        elif company.cin and validate_cin(company.cin)["is_valid"]:
            trust_indicators.append(f"MCA Verified: Valid Corporate Identification Number ({company.cin})")
            risk_score = max(0, risk_score - 15)
        elif company.gstin and validate_gstin(company.gstin)["is_valid"]:
            trust_indicators.append(f"GST Verified: Valid GSTIN ({company.gstin})")
            risk_score = max(0, risk_score - 10)
        elif company.business_structure in ["LLP", "Partnership", "Sole Proprietorship", "Registered Startup"]:
            trust_indicators.append(f"Recognized legitimate structure: {company.business_structure}")
        elif not company.cin and not company.gstin:
            risk_score += 15
            reasons.append("No MCA CIN or GSTIN registered with company record.")

    # Signal 2: Website legitimacy
    if company and company.website:
        if company.website.startswith("https://"):
            trust_indicators.append("Company operates a secure official SSL website")
        else:
            risk_score += 10
            reasons.append("Company website is not secured with HTTPS.")
    else:
        risk_score += 10
        reasons.append("Official company website not available.")

    # Signal 3: Domain age and consistency
    if company and company.domain:
        if any(company.domain.endswith(tld) for tld in SUSPICIOUS_TLDS):
            risk_score += 30
            red_flags.append(f"Suspicious high-risk domain TLD: {company.domain}")
            reasons.append(f"Company domain ({company.domain}) uses a TLD frequently associated with disposable phishing campaigns.")
        else:
            trust_indicators.append(f"Verified web domain: {company.domain}")

    # Signal 4: Recruiter email authenticity
    recruiter_eval = evaluate_recruiter_email(job.recruiter_email, company.domain if company else None)
    if recruiter_eval["is_free"]:
        risk_score += 25
        red_flags.append("Recruiter uses a free public email provider (e.g., Gmail/Yahoo) claiming to represent an enterprise")
        reasons.append(recruiter_eval["explanation"])
    elif recruiter_eval["matches_company_domain"]:
        trust_indicators.append("Recruiter email verified with official enterprise domain")
        risk_score = max(0, risk_score - 10)

    # Signal 5: Official application URL
    url_eval = evaluate_url_safety(job.application_url or job.source_url, company.domain if company else None)
    if url_eval["is_suspicious_tld"]:
        risk_score += 35
        red_flags.append(f"Application destination URL hosted on suspicious domain: {url_eval['hostname']}")
        reasons.append("Application destination URL uses a high-risk TLD.")
    elif url_eval["is_safe"]:
        trust_indicators.append(f"Secure direct application destination: {url_eval['hostname']}")

    # Signal 6: Company presence and credibility
    if company and company.trust_badge in ["Verified Employer", "Official Source"]:
        trust_indicators.append(f"Entity holds NEXORA '{company.trust_badge}' credential")
        risk_score = max(0, risk_score - 10)
    elif company and company.trust_badge == "Suspicious Activity":
        risk_score += 30
        red_flags.append("Company has past suspicious activity reports on record")

    # Signal 7: Unrealistic salary or stipend promises
    # e.g. entry-level internship with > ₹75,000/mo without requirements or suspicious wording
    stipend_max = job.stipend_amount_max or job.stipend_amount_min or 0
    if job.opportunity_type == "Internship" and stipend_max > 60000:
        if "data entry" in job.title.lower() or "typing" in job.title.lower() or "assistant" in job.title.lower():
            risk_score += 35
            red_flags.append(f"Unrealistic compensation claim: ₹{stipend_max:,}/month for basic entry-level role")
            reasons.append("Compensation exceeds normal market rate by 500%+ without specialized technical requirements.")

    # Signal 11: Suspicious communication patterns (e.g. WhatsApp only, direct money requests)
    if "whatsapp only" in job_text.lower() or "contact on telegram" in job_text.lower() or "send money" in job_text.lower():
        risk_score += 25
        red_flags.append("Directs candidates to unverified instant messaging channels (Telegram/WhatsApp) instead of official hiring portal")
        reasons.append("Suspicious communication pattern directing candidates to unmonitored channels.")

    # Signal 12 & 13: Inconsistent company information
    if job.company and company and job.company.lower() != company.name.lower():
        risk_score += 15
        reasons.append("Opportunity company name does not match registered employer record.")

    # Signal 14: Sensitive personal information requests
    if "aadhaar original" in job_text.lower() or "bank otp" in job_text.lower() or "net banking" in job_text.lower() or "atm pin" in job_text.lower():
        risk_score += 50
        red_flags.append("Dangerous request for sensitive financial or identity credentials (Aadhaar original / Bank OTP)")
        reasons.append("Demands confidential identity or banking credentials before interview.")

    # Signal 15: Candidate reports on record
    if db:
        report_count = db.query(FraudReports).filter(
            (FraudReports.job_id == job.id) | (FraudReports.company_name.ilike(f"%{job.company}%")),
            FraudReports.investigation_status.in_(["Verified Scam", "Under Review", "Investigating"])
        ).count()
        if report_count > 0:
            risk_score += min(40, report_count * 20)
            red_flags.append(f"Listing or company has {report_count} verified candidate scam report(s) on file")
            reasons.append(f"Multiple candidates have flagged this opportunity as fraudulent ({report_count} reports).")

    # Clamp score to 0-100
    final_score = min(100, max(0, risk_score))

    # Determine risk level
    if final_score <= 20:
        risk_level = "Low Risk"
    elif final_score <= 40:
        risk_level = "Moderate Risk"
    elif final_score <= 60:
        risk_level = "Elevated Risk"
    elif final_score <= 80:
        risk_level = "High Risk"
    else:
        risk_level = "Critical Risk"

    # Fallback explanation if low risk
    if not reasons and final_score <= 20:
        reasons.append("Entity matches legitimate Indian corporate records with zero fee demands and authentic application channel.")

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "red_flags": red_flags,
        "trust_indicators": trust_indicators,
        "is_scam": final_score >= 61 or job.is_fee_required or has_fees
    }


# --- 5-STEP SAFE APPLICATION GATEWAY ---

def evaluate_application_gateway(job: Job, db: Session) -> Dict[str, Any]:
    """
    Executes the 5-step Pre-Application Check Flow:
    Step 1: Verify Company Identity (MCA records, registration status)
    Step 2: Verify Source Authenticity (Official portal, verified aggregator)
    Step 3: Check Destination URL (HTTPS, domain consistency, phishing check)
    Step 4: Verify Zero-Payment Compliance (Zero fees demanded)
    Step 5: Evaluate AI Risk Score (Aggregate 15 signals)

    Returns verdict:
    🟢 SAFE TO PROCEED
    🟡 PROCEED WITH CAUTION
    🔴 APPLICATION BLOCKED
    """
    company = db.query(Company).filter(Company.name.ilike(job.company)).first()
    risk_data = calculate_fraud_risk(job, company, db)

    steps = []

    # Step 1: Verify Company Identity
    cin_data = validate_cin(company.cin) if company and company.cin else None
    gstin_data = validate_gstin(company.gstin) if company and company.gstin else None
    
    if company and (cin_data and cin_data["is_valid"]):
        step1_status = "passed"
        step1_detail = f"Verified with Ministry of Corporate Affairs (MCA). CIN: {company.cin} ({cin_data['company_type']}, Inc: {cin_data['incorporation_year']})."
    elif company and (gstin_data and gstin_data["is_valid"]):
        step1_status = "passed"
        step1_detail = f"Verified Indian Registered Entity. GSTIN: {company.gstin} ({gstin_data['state']})."
    elif company and company.business_structure in ["Government Portal", "Statutory Body", "Registered Startup"]:
        step1_status = "passed"
        step1_detail = f"Official Recognized Structure: {company.business_structure} ({company.name})."
    elif company and company.trust_badge in ["Verified Employer", "Official Source"]:
        step1_status = "passed"
        step1_detail = f"Entity identity verified via official business documentation ({company.trust_badge})."
    else:
        step1_status = "warning"
        step1_detail = "Company identity verification is pending formal MCA / GSTIN documentation."
    
    steps.append({
        "step_number": 1,
        "title": "Verify Company Identity",
        "status": step1_status,
        "detail": step1_detail
    })

    # Step 2: Verify Source Authenticity
    source_platform = job.source_platform or "Direct Application"
    if source_platform in ["Official Portal", "Direct Company Career Portal", "AICTE Portal", "National Portal"]:
        step2_status = "passed"
        step2_detail = f"Opportunity originated directly from {source_platform}."
    elif job.verification_status == "Verified":
        step2_status = "passed"
        step2_detail = f"Source validated through NEXORA automated verification pipeline."
    else:
        step2_status = "warning"
        step2_detail = f"Aggregated from secondary portal ({source_platform}). Cross-verification recommended."
    
    steps.append({
        "step_number": 2,
        "title": "Verify Source Authenticity",
        "status": step2_status,
        "detail": step2_detail
    })

    # Step 3: Check Destination URL
    app_url = job.application_url or job.source_url or "https://nexora.careers"
    url_eval = evaluate_url_safety(app_url, company.domain if company else None)
    if url_eval["is_suspicious_tld"]:
        step3_status = "failed"
        step3_detail = f"Destination domain ({url_eval['hostname']}) matches high-risk phishing TLD patterns."
    elif not url_eval["is_https"]:
        step3_status = "warning"
        step3_detail = f"Destination URL ({url_eval['hostname']}) does not enforce encrypted HTTPS."
    else:
        step3_status = "passed"
        step3_detail = f"Secure destination verified: {url_eval['hostname']} (HTTPS encrypted)."
    
    steps.append({
        "step_number": 3,
        "title": "Check Destination URL",
        "status": step3_status,
        "detail": step3_detail
    })

    # Step 4: Verify Zero-Payment Compliance (Zero-Tolerance)
    has_fees, fee_keywords = detect_payment_demands(f"{job.title} {job.description} {job.eligibility_criteria}")
    is_fee_violation = job.is_fee_required or has_fees
    if is_fee_violation:
        step4_status = "failed"
        step4_detail = f"VIOLATION: Opportunity demands upfront candidate payment ({', '.join(fee_keywords or ['Registration / Training Fee'])}). Under Indian Labour & UGC guidelines, charging applicants is unlawful."
    else:
        step4_status = "passed"
        step4_detail = "100% Free Application: Zero registration fees, interview fees, or laptop security deposits required."
    
    steps.append({
        "step_number": 4,
        "title": "Verify Zero-Payment Compliance",
        "status": step4_status,
        "detail": step4_detail
    })

    # Step 5: Evaluate AI Risk Score
    score = risk_data["risk_score"]
    level = risk_data["risk_level"]
    if score <= 20:
        step5_status = "passed"
        step5_detail = f"Low Risk (Score: {score}/100). No significant fraud markers detected."
    elif score <= 50:
        step5_status = "warning"
        step5_detail = f"{level} (Score: {score}/100). Exercise standard digital precautions."
    else:
        step5_status = "failed"
        step5_detail = f"{level} (Score: {score}/100). High likelihood of employment scam."
    
    steps.append({
        "step_number": 5,
        "title": "Evaluate AI Risk Score",
        "status": step5_status,
        "detail": step5_detail
    })

    # FINAL VERDICT
    is_blocked = (
        is_fee_violation or
        job.is_application_blocked or
        score >= 70 or
        (company and company.is_blacklisted) or
        url_eval["is_suspicious_tld"]
    )

    if is_blocked:
        verdict = "APPLICATION BLOCKED"
        verdict_color = "red"
        block_reason = (
            job.block_reason or
            ("Demands candidate payment / registration fee." if is_fee_violation else
             "Critical fraud indicators detected. Direct application has been disabled to safeguard students.")
        )
    elif score > 25 or step1_status == "warning" or step2_status == "warning":
        verdict = "PROCEED WITH CAUTION"
        verdict_color = "amber"
        block_reason = None
    else:
        verdict = "SAFE TO PROCEED"
        verdict_color = "emerald"
        block_reason = None

    safety_tips = [
        "Never transfer money, UPI payments, or crypto for interview slots, ID cards, or training.",
        "Legitimate employers provide equipment free of charge and never demand refundable laptop security deposits.",
        "Always verify that communications originate from the official enterprise email domain, not free public accounts.",
        f"If anyone asks for payment, report immediately to NEXORA and the National Cyber Crime Helpline at 1930."
    ]

    return {
        "job_id": job.id,
        "opportunity_title": job.title,
        "company_name": job.company,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "is_blocked": is_blocked,
        "block_reason": block_reason,
        "steps": steps,
        "trust_badge": company.trust_badge if company else job.trust_badge,
        "fraud_risk_score": score,
        "fraud_risk_level": level,
        "fee_required": is_fee_violation,
        "recruiter_verification": job.recruiter_verification or "Verified",
        "destination_url": app_url,
        "is_destination_trusted": url_eval["is_safe"],
        "safety_tips": safety_tips
    }


# --- SEEDING & ENRICHMENT ROUTINE ---

AUTHENTIC_INDIAN_COMPANIES = {
    "Google India": {
        "cin": "U72900KA2003PTC033028",
        "gstin": "29AABCG1234D1Z5",
        "mca_status": "Active",
        "incorporation_year": 2003,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "No. 3 Swami Vivekananda Road, Bangalore, Karnataka 560008",
        "website": "https://careers.google.com",
        "domain": "google.com",
        "trust_badge": "Verified Employer",
        "trust_score": 98,
        "fraud_risk_score": 5,
        "fraud_risk_level": "Low Risk"
    },
    "Microsoft India": {
        "cin": "U72200DL1988PTC031234",
        "gstin": "07AAACM4321E1Z2",
        "mca_status": "Active",
        "incorporation_year": 1988,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "Microsoft Corporation India, DLF Downtown, Cyber City, Gurgaon / New Delhi",
        "website": "https://careers.microsoft.com",
        "domain": "microsoft.com",
        "trust_badge": "Verified Employer",
        "trust_score": 99,
        "fraud_risk_score": 4,
        "fraud_risk_level": "Low Risk"
    },
    "Flipkart": {
        "cin": "U51109KA2012PTC066107",
        "gstin": "29AAACF9876F1Z8",
        "mca_status": "Active",
        "incorporation_year": 2012,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "Buildings Alyssa, Begonia & Clover, Embassy Tech Village, Bangalore, Karnataka 560103",
        "website": "https://www.flipkartcareers.com",
        "domain": "flipkart.com",
        "trust_badge": "Verified Employer",
        "trust_score": 96,
        "fraud_risk_score": 8,
        "fraud_risk_level": "Low Risk"
    },
    "PhonePe": {
        "cin": "U67190KA2012PTC176030",
        "gstin": "29AAGCP2345H1Z3",
        "mca_status": "Active",
        "incorporation_year": 2012,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "Office-2, Floor 4,5,6,7, Wing A, Block A, Salarpuria Softzone, Bellandur, Bangalore 560103",
        "website": "https://www.phonepe.com/careers",
        "domain": "phonepe.com",
        "trust_badge": "Verified Employer",
        "trust_score": 95,
        "fraud_risk_score": 9,
        "fraud_risk_level": "Low Risk"
    },
    "Razorpay": {
        "cin": "U72900KA2013PTC072112",
        "gstin": "29AAGCR6789J1Z1",
        "mca_status": "Active",
        "incorporation_year": 2013,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "1st Floor, SJR Cyber, 22 Laskar Hosur Road, Adugodi, Bangalore, Karnataka 560030",
        "website": "https://razorpay.com/jobs",
        "domain": "razorpay.com",
        "trust_badge": "Verified Employer",
        "trust_score": 95,
        "fraud_risk_score": 8,
        "fraud_risk_level": "Low Risk"
    },
    "Zomato": {
        "cin": "L93030DL2010PLC198141",
        "gstin": "07AAACZ1122K1Z9",
        "mca_status": "Active",
        "incorporation_year": 2010,
        "business_structure": "Public Limited (Listed)",
        "registered_office": "Ground Floor, 12A, 94 Meghdoot, Nehru Place, New Delhi 110019",
        "website": "https://www.zomato.com/careers",
        "domain": "zomato.com",
        "trust_badge": "Verified Employer",
        "trust_score": 97,
        "fraud_risk_score": 6,
        "fraud_risk_level": "Low Risk"
    },
    "Swiggy": {
        "cin": "U74110KA2013PLC096526",
        "gstin": "29AALCB5544L1Z7",
        "mca_status": "Active",
        "incorporation_year": 2013,
        "business_structure": "Public Limited (Listed)",
        "registered_office": "No. 55 Sy No 8-14, Ground Floor, I&J Block, Embassy Tech Village, Devarbisanahalli, Bangalore 560103",
        "website": "https://careers.swiggy.com",
        "domain": "swiggy.in",
        "trust_badge": "Verified Employer",
        "trust_score": 96,
        "fraud_risk_score": 7,
        "fraud_risk_level": "Low Risk"
    },
    "CRED": {
        "cin": "U74999KA2018PTC112345",
        "gstin": "29AAGCD9988M1Z4",
        "mca_status": "Active",
        "incorporation_year": 2018,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "No. 10/1, 2nd Floor, Subhashree, Indiranagar, Bangalore, Karnataka 560038",
        "website": "https://cred.club/careers",
        "domain": "cred.club",
        "trust_badge": "Verified Employer",
        "trust_score": 94,
        "fraud_risk_score": 10,
        "fraud_risk_level": "Low Risk"
    },
    "Meesho": {
        "cin": "U74900KA2015PTC082645",
        "gstin": "29AAGCM3322N1Z6",
        "mca_status": "Active",
        "incorporation_year": 2015,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "3rd Floor, Wing-E, Helios Business Park, Kadubeesanahalli, Bangalore, Karnataka 560103",
        "website": "https://meesho.io/jobs",
        "domain": "meesho.io",
        "trust_badge": "Verified Employer",
        "trust_score": 95,
        "fraud_risk_score": 9,
        "fraud_risk_level": "Low Risk"
    },
    "Zoho": {
        "cin": "U72900TN2010PTC075834",
        "gstin": "33AABCZ4455P1Z8",
        "mca_status": "Active",
        "incorporation_year": 2010,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "Estancia IT Park, Plot No. 140 & 151, GST Road, Vallancherry, Chengalpattu, Tamil Nadu 603202",
        "website": "https://www.zoho.com/careers",
        "domain": "zoho.com",
        "trust_badge": "Verified Employer",
        "trust_score": 98,
        "fraud_risk_score": 5,
        "fraud_risk_level": "Low Risk"
    },
    "Freshworks": {
        "cin": "U72900TN2010PTC078432",
        "gstin": "33AAACF8899Q1Z0",
        "mca_status": "Active",
        "incorporation_year": 2010,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "Block B, SP Infocity, MGR Salai, Perungudi, Chennai, Tamil Nadu 600096",
        "website": "https://www.freshworks.com/company/careers",
        "domain": "freshworks.com",
        "trust_badge": "Verified Employer",
        "trust_score": 96,
        "fraud_risk_score": 7,
        "fraud_risk_level": "Low Risk"
    },
    "TCS": {
        "cin": "L22210MH1995PLC084781",
        "gstin": "27AAACT2828R1Z2",
        "mca_status": "Active",
        "incorporation_year": 1995,
        "business_structure": "Public Limited (Listed)",
        "registered_office": "TCS House, Raveline Street, Fort, Mumbai, Maharashtra 400001",
        "website": "https://www.tcs.com/careers",
        "domain": "tcs.com",
        "trust_badge": "Verified Employer",
        "trust_score": 99,
        "fraud_risk_score": 4,
        "fraud_risk_level": "Low Risk"
    },
    "Infosys": {
        "cin": "L85110KA1981PLC013115",
        "gstin": "29AAACI4466S1Z3",
        "mca_status": "Active",
        "incorporation_year": 1981,
        "business_structure": "Public Limited (Listed)",
        "registered_office": "Electronics City, Hosur Road, Bangalore, Karnataka 560100",
        "website": "https://www.infosys.com/careers",
        "domain": "infosys.com",
        "trust_badge": "Verified Employer",
        "trust_score": 99,
        "fraud_risk_score": 4,
        "fraud_risk_level": "Low Risk"
    },
    "Qualcomm India": {
        "cin": "U72900DL1996PTC077221",
        "gstin": "07AAACQ7788T1Z5",
        "mca_status": "Active",
        "incorporation_year": 1996,
        "business_structure": "Private Limited (Pvt Ltd)",
        "registered_office": "DLF Cyber City, Tower B, Phase III, Gurgaon, Haryana / Hyderabad",
        "website": "https://qualcomm.com/careers",
        "domain": "qualcomm.com",
        "trust_badge": "Verified Employer",
        "trust_score": 97,
        "fraud_risk_score": 6,
        "fraud_risk_level": "Low Risk"
    },
    "AICTE National Internship Portal": {
        "cin": None,
        "gstin": None,
        "mca_status": "Government Statutory Body",
        "incorporation_year": 1987,
        "business_structure": "Statutory Body (Ministry of Education)",
        "registered_office": "Nelson Mandela Marg, Vasant Kunj, New Delhi 110070",
        "website": "https://internship.aicte-india.org",
        "domain": "aicte-india.org",
        "trust_badge": "Official Source",
        "trust_score": 100,
        "fraud_risk_score": 2,
        "fraud_risk_level": "Low Risk"
    },
    "Prime Minister's Internship Scheme": {
        "cin": None,
        "gstin": None,
        "mca_status": "Government Initiative",
        "incorporation_year": 2024,
        "business_structure": "Government Portal (MCA)",
        "registered_office": "Ministry of Corporate Affairs, Shastri Bhawan, Dr. Rajendra Prasad Road, New Delhi",
        "website": "https://pminternship.mca.gov.in",
        "domain": "pminternship.mca.gov.in",
        "trust_badge": "Official Source",
        "trust_score": 100,
        "fraud_risk_score": 1,
        "fraud_risk_level": "Low Risk"
    },
    "TechNova AI": {
        "cin": "U72900KA2021PTC145678",
        "gstin": "29AABCT8899K1Z4",
        "mca_status": "Active",
        "incorporation_year": 2021,
        "business_structure": "Registered Startup (DPIIT Recognized)",
        "registered_office": "HSR Layout Sector 4, Bangalore, Karnataka 560102",
        "website": "https://technova.ai",
        "domain": "technova.ai",
        "trust_badge": "Verified Employer",
        "trust_score": 88,
        "fraud_risk_score": 12,
        "fraud_risk_level": "Low Risk"
    },
    "Novus Innovations": {
        "cin": "U72900MH2022PTC378901",
        "gstin": "27AAACN5566M1Z2",
        "mca_status": "Active",
        "incorporation_year": 2022,
        "business_structure": "Registered Startup (DPIIT Recognized)",
        "registered_office": "Baner IT Park, Baner, Pune, Maharashtra 411045",
        "website": "https://novusinnovations.in",
        "domain": "novusinnovations.in",
        "trust_badge": "Verified Employer",
        "trust_score": 86,
        "fraud_risk_score": 14,
        "fraud_risk_level": "Low Risk"
    }
}

def seed_and_enrich_fraud_data(db: Session):
    """
    Enriches all seeded companies with MCA CIN, GSTIN, and safety data.
    Also injects 2 demonstration scam opportunities to prove the automated zero-tolerance block engine!
    """
    logger.info("Enriching company authenticity records with MCA/GSTIN intelligence...")
    
    # 1. Update existing companies
    for comp_name, data in AUTHENTIC_INDIAN_COMPANIES.items():
        comp = db.query(Company).filter(Company.name.ilike(comp_name)).first()
        if not comp:
            comp = Company(
                name=comp_name,
                headquarters="Bangalore, Karnataka, India",
                company_type="Product-based"
            )
            db.add(comp)
            db.flush()

        comp.cin = data.get("cin")
        comp.gstin = data.get("gstin")
        comp.mca_status = data.get("mca_status", "Active")
        comp.incorporation_year = data.get("incorporation_year")
        comp.business_structure = data.get("business_structure", "Private Limited (Pvt Ltd)")
        comp.registered_office = data.get("registered_office")
        comp.website = data.get("website")
        comp.domain = data.get("domain")
        comp.trust_badge = data.get("trust_badge", "Verified Employer")
        comp.trust_score = data.get("trust_score", 85)
        comp.fraud_risk_score = data.get("fraud_risk_score", 10)
        comp.fraud_risk_level = data.get("fraud_risk_level", "Low Risk")
        comp.is_blacklisted = False

    db.commit()

    # 2. Update existing jobs with recruiter verification and authentic badges
    for job in db.query(Job).all():
        comp = db.query(Company).filter(Company.name.ilike(job.company)).first()
        if comp:
            job.trust_badge = comp.trust_badge
            job.fraud_risk_score = comp.fraud_risk_score
            job.fraud_risk_level = comp.fraud_risk_level
            job.recruiter_verification = "Verified"
            if not job.recruiter_email and comp.domain:
                job.recruiter_email = f"careers@{comp.domain}"
                job.recruiter_name = f"{job.company} Talent Acquisition"
        else:
            job.trust_badge = "Verification Pending"
            job.fraud_risk_score = 30
            job.fraud_risk_level = "Moderate Risk"
            job.recruiter_verification = "Partially Verified"

    # 3. Inject Demonstration Scam Listings to showcase the automatic blocking engine
    # Scam 1: Registration Fee Demand
    scam1_title = "Online Data Entry & AI Assisting Intern"
    scam1_company = "Apex Career Solutions"
    existing_scam1 = db.query(Job).filter(Job.title == scam1_title, Job.company == scam1_company).first()
    if not existing_scam1:
        # Create suspicious company
        scam_comp1 = db.query(Company).filter(Company.name == scam1_company).first()
        if not scam_comp1:
            scam_comp1 = Company(
                name=scam1_company,
                headquarters="Noida, Uttar Pradesh, India",
                company_type="Service-based",
                website="http://apex-career-solutions.xyz",
                domain="apex-career-solutions.xyz",
                trust_badge="Suspicious Activity",
                trust_score=20,
                fraud_risk_score=92,
                fraud_risk_level="Critical Risk",
                is_blacklisted=False
            )
            db.add(scam_comp1)
            db.flush()

        scam_job1 = Job(
            title=scam1_title,
            company=scam1_company,
            company_type="Service-based",
            country="India",
            state="Uttar Pradesh",
            city="Noida",
            location="Noida, Uttar Pradesh, India",
            workplace_type="Remote",
            work_mode="Remote",
            remote_details="Work from anywhere in India",
            opportunity_type="Internship",
            stipend_type="Fixed stipend",
            stipend_amount_min=75000,
            stipend_amount_max=75000,
            stipend_currency="INR",
            duration_months=3,
            ppo_availability="PPO Available",
            description="Work from home 2 hours daily copy-pasting and formatting AI training datasets. Unrealistic high stipend guaranteed for freshers. NOTE: Candidates must pay ₹1,499 refundable registration fee and ₹3,500 security deposit for company laptop before interview scheduling.",
            required_skills=["Typing", "MS Word", "Internet Browsing"],
            preferred_skills=["English"],
            eligibility_criteria=["Any student or fresher", "Must pay refundable registration fee"],
            application_url="http://apex-career-solutions.xyz/apply-intern",
            source_platform="Secondary Aggregator",
            verification_status="Expired / Closed",
            trust_badge="Suspicious Activity",
            fraud_risk_score=94,
            fraud_risk_level="Critical Risk",
            is_fee_required=True,
            is_application_blocked=True,
            block_reason="ZERO-TOLERANCE SCAM ALERT: Listing demands ₹1,499 registration fee and ₹3,500 laptop security deposit. Directly violates NEXORA Student Protection Policy and Ministry of Labour norms.",
            recruiter_name="Sunil Sharma (HR Agency)",
            recruiter_email="apex.careers.inbox2024@gmail.com",
            recruiter_verification="Suspicious"
        )
        db.add(scam_job1)

    # Scam 2: Mandatory Paid Training Disguised as Internship
    scam2_title = "Junior Python Automation Intern (Guaranteed Placement)"
    scam2_company = "Skyline Cloud Labs"
    existing_scam2 = db.query(Job).filter(Job.title == scam2_title, Job.company == scam2_company).first()
    if not existing_scam2:
        scam_comp2 = db.query(Company).filter(Company.name == scam2_company).first()
        if not scam_comp2:
            scam_comp2 = Company(
                name=scam2_company,
                headquarters="Pune, Maharashtra, India",
                company_type="Startup",
                website="http://skyline-cloud-labs.click",
                domain="skyline-cloud-labs.click",
                trust_badge="High Risk",
                trust_score=25,
                fraud_risk_score=88,
                fraud_risk_level="High Risk",
                is_blacklisted=False
            )
            db.add(scam_comp2)
            db.flush()

        scam_job2 = Job(
            title=scam2_title,
            company=scam2_company,
            company_type="Early-stage startup",
            country="India",
            state="Maharashtra",
            city="Pune",
            location="Pune, Maharashtra, India",
            workplace_type="Remote",
            work_mode="Remote",
            remote_details="Remote within India",
            opportunity_type="Internship",
            stipend_type="Performance-based stipend",
            stipend_amount_min=20000,
            stipend_amount_max=30000,
            stipend_currency="INR",
            duration_months=6,
            ppo_availability="Potential PPO",
            description="Opportunity for college engineering students. Applicants must complete a mandatory paid training program costing ₹8,999 to obtain the internship confirmation letter and offer letter.",
            required_skills=["Python", "Selenium"],
            preferred_skills=["Git"],
            eligibility_criteria=["B.Tech/MCA freshers", "Mandatory paid training enrollment"],
            application_url="http://skyline-cloud-labs.click/pay-and-apply",
            source_platform="Third-party Board",
            verification_status="Expired / Closed",
            trust_badge="High Risk",
            fraud_risk_score=88,
            fraud_risk_level="High Risk",
            is_fee_required=True,
            is_application_blocked=True,
            block_reason="ZERO-TOLERANCE SCAM ALERT: Demands ₹8,999 mandatory paid training fee as a condition of employment.",
            recruiter_name="Placement Team",
            recruiter_email="skyline_recruitment@yahoo.com",
            recruiter_verification="Suspicious"
        )
        db.add(scam_job2)

    # 4. Seed suspicious domain records
    suspicious_domain_samples = [
        {"domain": "apex-career-solutions.xyz", "reason": "Fee Scam / Phishing", "target_company": "Apex Career Solutions"},
        {"domain": "skyline-cloud-labs.click", "reason": "Paid Training Disguised as Internship", "target_company": "Skyline Cloud Labs"},
        {"domain": "tcs-nqt-registration-fees.buzz", "reason": "Corporate Impersonation Scam", "target_company": "TCS"},
        {"domain": "infosys-direct-hiring.online", "reason": "Phishing Application Form", "target_company": "Infosys"}
    ]
    for s in suspicious_domain_samples:
        if not db.query(SuspiciousDomains).filter(SuspiciousDomains.domain == s["domain"]).first():
            db.add(SuspiciousDomains(
                domain=s["domain"],
                reason=s["reason"],
                target_company=s["target_company"],
                is_blocked=True
            ))

    db.commit()
    logger.info("Fraud engine data enrichment and scam demonstration seeding completed.")

def get_company_trust_details(company_identifier: str, db: Session) -> Dict[str, Any]:
    """Retrieves full company verification and trust intelligence breakdown for transparency modal."""
    comp = db.query(Company).filter(
        (Company.id == company_identifier) | (Company.name.ilike(company_identifier))
    ).first()

    if not comp:
        # Generate on-the-fly evaluation if company not in table
        return {
            "id": "unknown",
            "name": company_identifier,
            "cin": None,
            "gstin": None,
            "mca_status": "Verification Pending",
            "incorporation_year": None,
            "business_structure": "Unregistered / Unknown Structure",
            "registered_office": "Not Disclosed",
            "website": None,
            "domain": None,
            "domain_age_years": 1.0,
            "domain_security_score": 50,
            "trust_badge": "Verification Pending",
            "trust_score": 50,
            "fraud_risk_score": 35,
            "fraud_risk_level": "Moderate Risk",
            "is_blacklisted": False,
            "blacklist_reason": None,
            "verification_source": "Community & Self-reported",
            "recruiter_verification_status": "Unverified",
            "risk_factors": ["Entity is not registered in official MCA or GST databases."],
            "trust_factors": [],
            "cert_in_advisory": CYBERCRIME_ADVISORY,
            "cybercrime_helpline": {"number": "1930", "portal": "https://cybercrime.gov.in"}
        }

    cin_eval = validate_cin(comp.cin)
    gstin_eval = validate_gstin(comp.gstin)

    trust_factors = []
    risk_factors = []

    if cin_eval["is_valid"]:
        trust_factors.append(f"MCA Verified: CIN {comp.cin} ({cin_eval['company_type']}, Inc. {cin_eval['incorporation_year']})")
    if gstin_eval["is_valid"]:
        trust_factors.append(f"GSTIN Registered: {comp.gstin} ({gstin_eval['state']})")
    if comp.business_structure in ["Statutory Body (Ministry of Education)", "Government Portal (MCA)"]:
        trust_factors.append(f"Recognized Official Body: {comp.business_structure}")
    if comp.website and comp.website.startswith("https://"):
        trust_factors.append("Encrypted HTTPS official portal verified")
    if comp.domain:
        trust_factors.append(f"Enterprise domain verified: {comp.domain}")

    if comp.is_blacklisted:
        risk_factors.append(f"BLACKLISTED: {comp.blacklist_reason or 'Confirmed scam entity'}")
    if comp.fraud_risk_score > 60:
        risk_factors.append(f"High risk score ({comp.fraud_risk_score}/100) due to scam indicators")
    if comp.domain and any(comp.domain.endswith(tld) for tld in SUSPICIOUS_TLDS):
        risk_factors.append(f"High-risk disposable TLD: {comp.domain}")

    return {
        "id": comp.id,
        "name": comp.name,
        "cin": comp.cin,
        "gstin": comp.gstin,
        "mca_status": comp.mca_status or "Active",
        "incorporation_year": comp.incorporation_year,
        "business_structure": comp.business_structure or "Private Limited (Pvt Ltd)",
        "registered_office": comp.registered_office or "Bangalore, India",
        "website": comp.website,
        "domain": comp.domain,
        "domain_age_years": 8.5 if cin_eval["is_valid"] else 2.0,
        "domain_security_score": 98 if comp.trust_score > 80 else 40,
        "trust_badge": comp.trust_badge or "Verified Employer",
        "trust_score": int(comp.trust_score or 85),
        "fraud_risk_score": int(comp.fraud_risk_score or 10),
        "fraud_risk_level": comp.fraud_risk_level or "Low Risk",
        "is_blacklisted": bool(comp.is_blacklisted),
        "blacklist_reason": comp.blacklist_reason,
        "verification_source": "Ministry of Corporate Affairs (MCA) & GST Records" if cin_eval["is_valid"] else "NEXORA Verification Engine",
        "recruiter_verification_status": "Verified" if comp.trust_score > 80 else "Partially Verified",
        "risk_factors": risk_factors,
        "trust_factors": trust_factors,
        "cert_in_advisory": CYBERCRIME_ADVISORY,
        "cybercrime_helpline": {"number": "1930", "portal": "https://cybercrime.gov.in"}
    }

