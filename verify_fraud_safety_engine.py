#!/usr/bin/env python3
"""
Comprehensive Automated Verification Suite for
Feature 16: AI COMPANY TRUST, FRAUD DETECTION & STUDENT SAFETY ENGINE
"""

import sys
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_cin_and_gstin_validation():
    print_header("Test 1: MCA Corporate Identification Number (CIN) & GSTIN Validation")
    from app.services.fraud_detection_service import validate_cin, validate_gstin
    
    # Valid Listed CIN (Zomato)
    zomato_cin = "L93030DL2010PLC198141"
    res1 = validate_cin(zomato_cin)
    assert res1["is_valid"] is True, "Expected valid CIN"
    assert res1["listing_status"] == "Listed"
    assert res1["incorporation_year"] == 2010
    assert res1["state"] == "Delhi"
    print(f"✓ Valid Listed CIN: {zomato_cin} -> {res1['listing_status']}, State: {res1['state']}, Inc: {res1['incorporation_year']}")

    # Valid Unlisted Pvt Ltd CIN (Google India)
    google_cin = "U72900KA2003PTC033028"
    res2 = validate_cin(google_cin)
    assert res2["is_valid"] is True
    assert res2["listing_status"] == "Unlisted"
    assert res2["state"] == "Karnataka"
    assert res2["incorporation_year"] == 2003
    print(f"✓ Valid Unlisted CIN: {google_cin} -> {res2['listing_status']}, State: {res2['state']}, Inc: {res2['incorporation_year']}")

    # Invalid CIN
    bad_cin = "INVALID123"
    res_bad = validate_cin(bad_cin)
    assert res_bad["is_valid"] is False
    print(f"✓ Invalid CIN caught correctly: '{bad_cin}' -> {res_bad['reason']}")

    # Valid GSTIN
    gstin = "29AABCG1234D1Z5"
    g_res = validate_gstin(gstin)
    assert g_res["is_valid"] is True
    assert g_res["state"] == "Karnataka"
    print(f"✓ Valid 15-digit GSTIN: {gstin} -> State: {g_res['state']}")

def test_recruiter_and_domain_safety():
    print_header("Test 2: Recruiter Authenticity & Domain TLD Safety")
    from app.services.fraud_detection_service import evaluate_recruiter_email, evaluate_url_safety

    # Free public email claiming to be enterprise recruiter
    free_email = "careers.google.india.recruitment@gmail.com"
    r1 = evaluate_recruiter_email(free_email, "google.com")
    assert r1["is_free"] is True
    assert r1["status"] == "Suspicious"
    print(f"✓ Free email detection: '{free_email}' flagged as {r1['status']} ({r1['explanation']})")

    # Enterprise matching domain
    corp_email = "jobs@google.com"
    r2 = evaluate_recruiter_email(corp_email, "google.com")
    assert r2["is_free"] is False
    assert r2["status"] == "Verified"
    print(f"✓ Matching corporate email: '{corp_email}' -> {r2['status']}")

    # Phishing TLD detection
    phishing_url = "http://google-jobs-career.xyz/apply-now"
    u1 = evaluate_url_safety(phishing_url, "google.com")
    assert u1["is_safe"] is False
    assert u1["is_suspicious_tld"] is True
    print(f"✓ High-risk TLD detected: '{phishing_url}' -> Suspicious TLD: {u1['is_suspicious_tld']}, Reasons: {u1['reasons']}")

def test_zero_tolerance_fee_scam_detection():
    print_header("Test 3: Zero-Tolerance Upfront Fee Scam Detection")
    from app.services.fraud_detection_service import detect_payment_demands

    scam_text = "Candidates must deposit ₹1,499 refundable registration fee and ₹3,500 laptop security deposit before interview."
    has_fees, keywords = detect_payment_demands(scam_text)
    assert has_fees is True
    assert "registration fee" in keywords
    assert "security deposit" in keywords
    print(f"✓ Payment demand keywords detected: {keywords}")

    legit_text = "Free application. Competitive stipend ₹40,000/month provided with comprehensive mentor guidance."
    has_fees2, _ = detect_payment_demands(legit_text)
    assert has_fees2 is False
    print("✓ Genuine listing passed fee check cleanly (0 payment triggers)")

def test_safe_application_gateway_api():
    print_header("Test 4: 5-Step Safe Application Gateway Endpoint")
    # Fetch all jobs to get a blocked scam job and a verified legit job
    r = requests.get(f"{BASE_URL}/jobs?page_size=30")
    assert r.status_code == 200, "Jobs API should return 200"
    jobs = r.json()["items"]
    
    scam_job = next((j for j in jobs if j.get("is_application_blocked")), None)
    assert scam_job is not None, "At least one blocked scam job should exist in seeded database"

    legit_job = next((j for j in jobs if j.get("company") == "Google India"), None)
    assert legit_job is not None, "Google India job should exist in seeded database"

    # Gateway Check on Scam Job
    res_scam = requests.post(f"{BASE_URL}/fraud/safety-check/{scam_job['id']}")
    assert res_scam.status_code == 200
    scam_data = res_scam.json()
    assert scam_data["verdict"] == "APPLICATION BLOCKED", f"Expected APPLICATION BLOCKED, got {scam_data['verdict']}"
    assert scam_data["is_blocked"] is True
    assert scam_data["verdict_color"] == "red"
    assert len(scam_data["steps"]) == 5
    print(f"✓ Gateway Verdict for SCAM ('{scam_job['title']}'):")
    print(f"  Verdict: {scam_data['verdict']} (Color: {scam_data['verdict_color']})")
    print(f"  Block Reason: {scam_data['block_reason']}")
    print(f"  Fee Required Flag: {scam_data['fee_required']}")
    print(f"  Risk Score: {scam_data['fraud_risk_score']}/100 ({scam_data['fraud_risk_level']})")

    # Gateway Check on Genuine Job
    res_legit = requests.post(f"{BASE_URL}/fraud/safety-check/{legit_job['id']}")
    assert res_legit.status_code == 200
    legit_data = res_legit.json()
    assert legit_data["verdict"] == "SAFE TO PROCEED", f"Expected SAFE TO PROCEED, got {legit_data['verdict']}"
    assert legit_data["is_blocked"] is False
    assert legit_data["verdict_color"] == "emerald"
    print(f"✓ Gateway Verdict for GENUINE ('{legit_job['title']}' by {legit_job['company']}):")
    print(f"  Verdict: {legit_data['verdict']} (Color: {legit_data['verdict_color']})")
    print(f"  Trust Badge: {legit_data['trust_badge']}")
    print(f"  Risk Score: {legit_data['fraud_risk_score']}/100 ({legit_data['fraud_risk_level']})")

def test_company_trust_transparency_api():
    print_header("Test 5: Company Authenticity & MCA Transparency API")
    r = requests.get(f"{BASE_URL}/fraud/company/Microsoft%20India/trust-details")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Microsoft India"
    assert data["cin"] == "U72200DL1988PTC031234"
    assert data["mca_status"] == "Active"
    assert data["trust_badge"] == "Verified Employer"
    assert data["trust_score"] >= 95
    assert "1930" in data["cybercrime_helpline"]["number"]
    print(f"✓ Microsoft India MCA Verification:")
    print(f"  CIN: {data['cin']} | Structure: {data['business_structure']}")
    print(f"  Trust Badge: {data['trust_badge']} | Trust Score: {data['trust_score']}/100")
    print(f"  Registered Office: {data['registered_office']}")
    print(f"  Trust Factors: {data['trust_factors'][:2]}")
    print(f"  Cybercrime Helpline: {data['cybercrime_helpline']}")

def test_student_fraud_reporting_system():
    print_header("Test 6: Student Confidential Fraud Reporting System")
    report_payload = {
        "company_name": "Apex Recruitment Agency",
        "opportunity_title": "Data Entry Intern",
        "reported_category": "Registration / Interview Fee Demanded",
        "amount_demanded": 1499,
        "description": "Recruiter asked me to send ₹1,499 via UPI before sending offer letter.",
        "evidence_urls": ["https://drive.google.com/file/d/sample-chat-evidence"],
        "recruiter_contact": "+91 98765 00000",
        "anonymous": True
    }
    r = requests.post(f"{BASE_URL}/fraud/report", json=report_payload)
    assert r.status_code == 201, f"Expected 201 Created, got {r.status_code}"
    report = r.json()
    assert report["id"] is not None
    assert report["company_name"] == "Apex Recruitment Agency"
    assert report["status"] == "Under Review"
    print(f"✓ Confidential fraud report created successfully!")
    print(f"  Report ID: {report['id']}")
    print(f"  Category: {report['reported_category']}")
    print(f"  Status: {report['status']}")

def test_admin_fraud_dashboard_api():
    print_header("Test 7: Admin Fraud Monitoring Dashboard API")
    r = requests.get(f"{BASE_URL}/fraud/admin/dashboard")
    assert r.status_code == 200
    dash = r.json()
    assert dash["total_verified_companies"] >= 15
    assert dash["blocked_scams_count"] >= 2
    assert dash["high_risk_opportunities"] >= 2
    assert dash["suspicious_domains_count"] >= 4
    print(f"✓ Admin Dashboard Metrics:")
    print(f"  Verified Companies: {dash['total_verified_companies']}")
    print(f"  Blocked Scams: {dash['blocked_scams_count']}")
    print(f"  High-Risk Listings: {dash['high_risk_opportunities']}")
    print(f"  Suspicious Monitored Domains: {dash['suspicious_domains_count']}")
    print(f"  Recent Student Reports: {len(dash['recent_fraud_reports'])}")
    print(f"  Flagged Listings in Queue: {len(dash['flagged_jobs'])}")

def test_admin_review_moderation_action():
    print_header("Test 8: Admin Moderation Action (Review & Block/Verify)")
    # Get a job to test admin action
    r = requests.get(f"{BASE_URL}/fraud/admin/dashboard")
    flagged = r.json()["flagged_jobs"]
    if flagged:
        target_job = flagged[0]
        # Admin restores or verifies
        action_payload = {
            "target_type": "job",
            "target_id": target_job["id"],
            "action": "restore",
            "decision_reason": "Automated verification test restore"
        }
        r_act = requests.post(f"{BASE_URL}/fraud/admin/review", json=action_payload)
        assert r_act.status_code == 200
        print(f"✓ Admin Action 'restore' executed successfully for job: {target_job['title']}")

        # Re-block to keep scam demonstration active
        action_reblock = {
            "target_type": "job",
            "target_id": target_job["id"],
            "action": "block",
            "decision_reason": "Zero-tolerance fee scam demonstration active"
        }
        r_reblock = requests.post(f"{BASE_URL}/fraud/admin/review", json=action_reblock)
        assert r_reblock.status_code == 200
        print("✓ Job re-locked with zero-tolerance reason")

def run_all_tests():
    print("\n" + "#" * 70)
    print("  STARTING FULL TEST SUITE: FEATURE 16 AI COMPANY TRUST & SAFETY")
    print("#" * 70)
    
    test_cin_and_gstin_validation()
    test_recruiter_and_domain_safety()
    test_zero_tolerance_fee_scam_detection()
    test_safe_application_gateway_api()
    test_company_trust_transparency_api()
    test_student_fraud_reporting_system()
    test_admin_fraud_dashboard_api()
    test_admin_review_moderation_action()

    print("\n" + "=" * 70)
    print("  ALL 8/8 FEATURE 16 VERIFICATION SUITES PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
