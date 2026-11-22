import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "nexora-backend"

def test_auth_and_profile_flow():
    with TestClient(app) as client:
        # 1. Register or Login
        reg_email = "alex.mercer.prod@nexora.io"
        reg_res = client.post("/api/auth/register", json={
            "name": "Alex Mercer",
            "email": reg_email,
            "password": "SecurePassword123!"
        })
        if reg_res.status_code == 400: # Already registered in previous test run
            login_res = client.post("/api/auth/login", json={
                "email": reg_email,
                "password": "SecurePassword123!"
            })
            assert login_res.status_code == 200
            token = login_res.json()["access_token"]
        else:
            assert reg_res.status_code == 200
            token = reg_res.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Me
        me_res = client.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == reg_email

        # 3. Create Profile
        prof_payload = {
            "current_role": "Python Backend Engineer",
            "experience_years": 3.0,
            "location": "San Francisco, CA",
            "preferred_roles": ["AI Backend Engineer", "Python Developer"],
            "preferred_locations": ["Remote", "San Francisco"],
            "salary_expectation": 160000,
            "employment_preference": "Remote",
            "bio": "Experienced building production FastAPI and RAG architectures.",
            "skills": [
                {"skill_name": "Python", "proficiency": "Expert", "category": "Technical"},
                {"skill_name": "FastAPI", "proficiency": "Advanced", "category": "Framework"},
                {"skill_name": "PostgreSQL", "proficiency": "Advanced", "category": "Database"},
                {"skill_name": "RAG", "proficiency": "Intermediate", "category": "AI/ML"},
                {"skill_name": "Docker", "proficiency": "Intermediate", "category": "DevOps"}
            ]
        }
        prof_res = client.post("/api/profile", json=prof_payload, headers=headers)
        assert prof_res.status_code == 200
        assert prof_res.json()["current_role"] == "Python Backend Engineer"
        assert len(prof_res.json()["skills"]) == 5

        # 4. Discover Jobs
        jobs_res = client.get("/api/jobs", headers=headers)
        assert jobs_res.status_code == 200
        jobs_data = jobs_res.json()
        assert jobs_data["total"] >= 1
        first_job = jobs_data["items"][0]
        assert first_job["id"] is not None
        assert first_job["match_score"] is not None

        # 5. Smart Matches
        smart_res = client.get("/api/matching/smart-matches", headers=headers)
        assert smart_res.status_code == 200
        smart_data = smart_res.json()
        assert "best_matches" in smart_data
        assert "strong_matches" in smart_data

        # 6. Skill Gap Diagnostics
        gap_res = client.get("/api/matching/skill-gap?target=AI Backend Engineer", headers=headers)
        assert gap_res.status_code == 200
        gap_data = gap_res.json()
        assert "overall_compatibility" in gap_data
        assert len(gap_data["skills"]) >= 3

        # 7. LangGraph Agent Chat
        chat_res = client.post("/api/agent/chat", json={
            "message": "Find suitable opportunities matching my Python and RAG experience"
        }, headers=headers)
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert "role" in chat_data and chat_data["role"] == "assistant"
        assert len(chat_data["content"]) > 20
