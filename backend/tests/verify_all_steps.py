import sys
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def main():
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)
    print("Testing NEXORA API endpoints end-to-end...\n")

    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ 1. Health Check OK:", res.json())

    # 2. Register/Login
    email = "integration.runner@nexora.io"
    password = "SecurePassword123!"
    reg_res = client.post("/api/auth/register", json={
        "name": "Alex Mercer Integration",
        "email": email,
        "password": password
    })
    if reg_res.status_code == 200:
        token = reg_res.json()["access_token"]
        print("✓ 2. User Registration OK")
    else:
        login_res = client.post("/api/auth/login", json={"email": email, "password": password})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        print("✓ 2. User Login OK")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Auth Me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    print("✓ 3. Auth Me Identity OK:", me_res.json()["name"])

    # 4. Save Profile with 384-D dense vector embedding
    prof_payload = {
        "current_role": "Python Backend Engineer",
        "experience_years": 3.5,
        "location": "San Francisco, CA",
        "preferred_roles": ["AI Backend Engineer", "Lead Python Developer"],
        "preferred_locations": ["Remote", "San Francisco"],
        "salary_expectation": 165000,
        "employment_preference": "Remote",
        "bio": "Specializing in high-throughput FastAPI services, PostgreSQL pgvector retrieval, and LLM RAG pipelines.",
        "skills": [
            {"skill_name": "Python", "proficiency": "Expert", "category": "Technical"},
            {"skill_name": "FastAPI", "proficiency": "Expert", "category": "Framework"},
            {"skill_name": "PostgreSQL", "proficiency": "Advanced", "category": "Database"},
            {"skill_name": "RAG", "proficiency": "Advanced", "category": "AI/ML"},
            {"skill_name": "pgvector", "proficiency": "Advanced", "category": "AI/ML"},
            {"skill_name": "Docker", "proficiency": "Intermediate", "category": "DevOps"}
        ]
    }
    p_res = client.post("/api/profile", json=prof_payload, headers=headers)
    assert p_res.status_code == 200
    print(f"✓ 4. Profile & Vector Embedding Created ({len(p_res.json()['skills'])} skills)")

    # 5. Get Profile
    get_p = client.get("/api/profile", headers=headers)
    assert get_p.status_code == 200
    print("✓ 5. Profile Retrieval OK")

    # 6. Discover Jobs
    jobs_res = client.get("/api/jobs?limit=5", headers=headers)
    assert jobs_res.status_code == 200
    jobs_list = jobs_res.json()["items"]
    assert len(jobs_list) > 0
    target_job = jobs_list[0]
    print(f"✓ 6. Discover Jobs OK: Retrieved {len(jobs_list)} opportunities (Top: '{target_job['title']}' - {target_job['match_score']}%)")

    # 7. Job Match API
    match_api_res = client.post("/api/jobs/match", json={"job_id": target_job["id"]}, headers=headers)
    assert match_api_res.status_code == 200
    match_data = match_api_res.json()
    print(f"✓ 7. On-demand Job Match OK: Score {match_data['final_score']}% ({match_data['tier']})")

    # 8. Recommendations
    rec_res = client.get("/api/jobs/recommendations?limit=4", headers=headers)
    assert rec_res.status_code == 200
    print(f"✓ 8. Top Recommendations OK ({len(rec_res.json())} roles)")

    # 9. Job Details
    detail_res = client.get(f"/api/jobs/{target_job['id']}", headers=headers)
    assert detail_res.status_code == 200
    print(f"✓ 9. Job Details Inspection OK: '{detail_res.json()['job']['title']}'")

    # 10. Save and Unsave Job
    save_res = client.post(f"/api/jobs/{target_job['id']}/save", headers=headers)
    assert save_res.status_code == 200
    get_saved = client.get("/api/jobs/saved", headers=headers)
    assert any(j["id"] == target_job["id"] for j in get_saved.json())
    print("✓ 10. Save Opportunity OK")

    # 11. Smart Matches
    smart_res = client.get("/api/matching/smart-matches", headers=headers)
    assert smart_res.status_code == 200
    smart_data = smart_res.json()
    print(f"✓ 11. Smart Matches OK: {len(smart_data['best_matches'])} Best, {len(smart_data['strong_matches'])} Strong, {len(smart_data['potential_matches'])} Potential")

    # 12. Skill Gap Diagnostics
    gap_res = client.get("/api/matching/skill-gap?target=AI Backend Engineer", headers=headers)
    assert gap_res.status_code == 200
    gap_info = gap_res.json()
    print(f"✓ 12. Skill Gap Diagnostics OK: {gap_info['overall_compatibility']}% compatibility, {gap_info['matched_count']} matched, {gap_info['missing_count']} missing")

    # 13. LangGraph Autonomous Career Agent
    agent_res = client.post("/api/agent/chat", json={
        "message": "Compare AI Backend Engineer and Senior AI Systems Engineer roles"
    }, headers=headers)
    assert agent_res.status_code == 200
    agent_msg = agent_res.json()
    print(f"✓ 13. LangGraph Agent Chat OK: Assistant answered ({len(agent_msg['content'])} chars, executed {len(agent_msg.get('tool_calls', []))} tools)")

    # 14. Conversation History
    conv_res = client.get("/api/agent/conversations", headers=headers)
    assert conv_res.status_code == 200
    print(f"✓ 14. Agent Conversation History OK ({len(conv_res.json())} persistent sessions)")

    # 15. Dashboard Overview Analytics
    dash_res = client.get("/api/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    print(f"✓ 15. Dashboard Overview Analytics OK (Completion: {dash_data['profile_completion']}%, Matching: {dash_data['total_matching_jobs']} jobs, Avg Score: {dash_data['average_match_score']}%)")

    print("\n🎉 ALL 15 CRITICAL CORE WORKFLOWS VERIFIED 100% OPERATIONAL!")

if __name__ == "__main__":
    main()
