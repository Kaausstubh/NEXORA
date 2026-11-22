import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"
FRONTEND_URL = "http://localhost:3000"

def test_endpoint(desc, func):
    try:
        func()
        print(f"✅ PASS: {desc}")
        return True
    except Exception as e:
        print(f"❌ FAIL: {desc} -> {e}")
        return False

passed = 0
total = 0

def check(condition, msg):
    if not condition:
        raise AssertionError(msg)

# 1. Test India vs International filtering
def t1():
    res = requests.get(f"{BASE_URL}/jobs?country=India").json()
    check(res["total"] >= 15, f"Expected >= 15 India jobs, got {res['total']}")
    for item in res["items"]:
        check(item.get("country") == "India" or item.get("country") is None, f"Found non-India job: {item.get('title')}")
test_endpoint("1. India Country Filter Prioritization", t1)

def t2():
    res = requests.get(f"{BASE_URL}/jobs?country=International").json()
    check(res["total"] >= 1, "Expected international jobs")
    check(any("United States" in str(j.get("country")) for j in res["items"]), "No US/International jobs returned")
test_endpoint("2. International Country Filter", t2)

# 3. Test Location & Pune sub-localities
def t3():
    res = requests.get(f"{BASE_URL}/jobs?country=India&city=Pune").json()
    check(res["total"] >= 6, f"Expected >= 6 Pune jobs, got {res['total']}")
    localities = {j.get("locality") for j in res["items"] if j.get("locality")}
    check("Hinjewadi" in localities or "Baner" in localities or "Kharadi" in localities, f"Missing Pune sub-localities: {localities}")
test_endpoint("3. City & Pune Sub-Localities Awareness (Hinjewadi, Baner, Kharadi, Magarpatta)", t3)

# 4. Test Radius filtering
def t4():
    # Pune GPS: 18.5204, 73.8567 with 20 km radius
    res = requests.get(f"{BASE_URL}/jobs?country=India&user_lat=18.5204&user_lng=73.8567&radius_km=20").json()
    check(res["total"] >= 4, f"Expected >= 4 jobs within 20km of Pune, got {res['total']}")
    for j in res["items"]:
        if j.get("distance_km") is not None and not (j.get("work_mode") == "Remote"):
            check(j["distance_km"] <= 20.0, f"Job {j['title']} distance {j['distance_km']} exceeds 20km radius")
test_endpoint("4. Geolocation & Haversine Radius Filtering (20km radius)", t4)

# 5. Test Work Mode multi-select
def t5():
    res_remote = requests.get(f"{BASE_URL}/jobs?work_modes=Remote").json()
    check(all("remote" in (j.get("work_mode") or "").lower() or "remote" in (j.get("workplace_type") or "").lower() for j in res_remote["items"]), "Non-remote job in remote filter")
    
    res_multi = requests.get(f"{BASE_URL}/jobs?work_modes=Remote&work_modes=Hybrid").json()
    modes = {(j.get("work_mode") or j.get("workplace_type") or "").lower() for j in res_multi["items"]}
    check(any("remote" in m for m in modes) and any("hybrid" in m for m in modes), "Multi-select did not return both Remote and Hybrid")
test_endpoint("5. Work Mode Interactive Multi-Select (Remote & Hybrid)", t5)

# 6. Test Stipend Filters
def t6():
    res = requests.get(f"{BASE_URL}/jobs?country=India&min_stipend=30000").json()
    check(res["total"] >= 10, f"Expected >= 10 jobs with stipend >= 30,000, got {res['total']}")
    for j in res["items"]:
        amount = j.get("stipend_amount_max") or j.get("salary_max")
        if amount is not None:
            check(amount >= 30000, f"Job {j['title']} stipend max {amount} < 30000")
test_endpoint("6. Monthly Stipend Filter (₹30,000+ INR in Indian Market)", t6)

# 7. Test PPO Opportunities
def t7():
    res = requests.get(f"{BASE_URL}/jobs?country=India&ppo_filter=ppo_only").json()
    check(res["total"] >= 8, f"Expected >= 8 PPO jobs, got {res['total']}")
    for j in res["items"]:
        avail = j.get("ppo_availability") or ""
        check("Available" in avail or "Conversion" in avail, f"Job {j['title']} does not have PPO: {avail}")
test_endpoint("7. PPO Filter (⭐ PPO Available & ⭐ Full-time Conversion)", t7)

# 8. Test Sorting Modes
def t8():
    res_stipend = requests.get(f"{BASE_URL}/jobs?country=India&sort_by=stipend_high").json()
    stipends = [j.get("stipend_amount_max") or 0 for j in res_stipend["items"]]
    check(stipends == sorted(stipends, reverse=True), "Jobs not sorted by highest stipend descending")
test_endpoint("8. Sorting Modes (Highest Stipend First)", t8)

# 9. Test Verification Engine
def t9():
    res = requests.post(f"{BASE_URL}/jobs/verify").json()
    check(res["status"] == "success", "Batch verification failed")
    check(res["results"]["verified"] >= 15, "Fewer than 15 verified jobs")
test_endpoint("9. Opportunity Verification Engine & Batch Audit", t9)

# 10. Test AI 4-Tier Matching
def t10():
    login_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Candidate Verification Test",
        "email": "cand.verif@nexora.io",
        "password": "SecurePassword2026!"
    }).json()
    token = login_res.get("access_token")
    if not token:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "cand.verif@nexora.io",
            "password": "SecurePassword2026!"
        }).json()
        token = login_res["access_token"]

    # Save candidate profile
    headers = {"Authorization": f"Bearer {token}"}
    requests.post(f"{BASE_URL}/profile", headers=headers, json={
        "current_role": "Python Backend Trainee",
        "experience_years": 0.5,
        "location": "Pune",
        "skills": [
            {"skill_name": "Python", "proficiency": "Advanced"},
            {"skill_name": "FastAPI", "proficiency": "Intermediate"},
            {"skill_name": "SQL", "proficiency": "Intermediate"},
            {"skill_name": "PostgreSQL", "proficiency": "Intermediate"},
            {"skill_name": "Git", "proficiency": "Intermediate"}
        ]
    })

    matches = requests.get(f"{BASE_URL}/matching/smart-matches", headers=headers).json()
    check(len(matches["excellent_matches"]) > 0, "No Excellent Matches returned")
    check(len(matches["strong_matches"]) > 0, "No Strong Matches returned")
    for ex in matches["excellent_matches"]:
        check(ex["breakdown"]["final_score"] >= 85.0, f"Excellent match score < 85: {ex['breakdown']['final_score']}")
test_endpoint("10. AI 4-Tier Matching Engine (🟢 Excellent, 🔵 Strong, 🟡 Moderate, 🔴 Low)", t10)

# 11. Test LangGraph Career Agent for Indian Queries
def t11():
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "cand.verif@nexora.io",
        "password": "SecurePassword2026!"
    }).json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    agent_res = requests.post(f"{BASE_URL}/agent/chat", headers=headers, json={
        "message": "Find Python internships in Pune with at least ₹15,000 stipend and PPO"
    }).json()
    content = agent_res.get("content", "")
    check("AICTE" in content or "TCS" in content or "NeuralCraft" in content or "Qualcomm" in content, "Agent did not identify relevant opportunities")
    check("₹" in content, "Stipend in INR not present in agent response")
    check("PPO" in content or "Conversion" in content, "PPO status not present in agent response")
test_endpoint("11. LangGraph Agent Natural Language Parsing for Indian Opportunities", t11)

# 12. Test Frontend Live Pages
def t12():
    r1 = requests.get(f"{FRONTEND_URL}/")
    check(r1.status_code == 200, f"Landing page returned {r1.status_code}")
    r2 = requests.get(f"{FRONTEND_URL}/dashboard/discover")
    check(r2.status_code == 200, f"Discover page returned {r2.status_code}")
    r3 = requests.get(f"{FRONTEND_URL}/dashboard/matches")
    check(r3.status_code == 200, f"Smart matches page returned {r3.status_code}")
test_endpoint("12. Frontend Live Pages Rendering (Landing, Discover, Matches)", t12)

print("\n--- ALL VERIFICATION TESTS COMPLETED ---")
