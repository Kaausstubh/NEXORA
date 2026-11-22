import pytest
from app.services.embedding_service import embedding_service, cosine_similarity
from app.services.matching_service import matching_service
from app.services.resume_service import resume_service
from app.models.entities import CandidateProfile, Job, CandidateSkill

@pytest.mark.asyncio
async def test_embedding_generation():
    text1 = "Senior Python Backend Engineer experienced in FastAPI, PostgreSQL, RAG, and pgvector."
    text2 = "AI Engineer working with Python, LLMs, LangChain, and vector embeddings."
    text3 = "Senior Fashion Designer specializing in apparel sourcing and textiles."

    vec1 = await embedding_service.generate_embedding(text1)
    vec2 = await embedding_service.generate_embedding(text2)
    vec3 = await embedding_service.generate_embedding(text3)

    assert len(vec1) == 384
    assert len(vec2) == 384
    assert len(vec3) == 384

    sim_related = cosine_similarity(vec1, vec2)
    sim_unrelated = cosine_similarity(vec1, vec3)

    assert sim_related > sim_unrelated
    assert sim_related > 0.40

def test_hybrid_ranking_calculation():
    profile = CandidateProfile(
        experience_years=3.0,
        location="Remote",
        preferred_locations=["Remote", "San Francisco"],
        embedding=[0.1] * 384
    )
    skills = ["Python", "FastAPI", "PostgreSQL", "RAG", "Docker"]

    job = Job(
        title="AI Backend Engineer",
        company="TechNova",
        location="San Francisco, CA",
        workplace_type="Remote",
        experience_required=2.0,
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        preferred_skills=["RAG", "Kubernetes"],
        embedding=[0.1] * 384
    )

    match = matching_service.calculate_hybrid_match(profile, skills, job)

    assert "final_score" in match
    assert match["final_score"] >= 80.0
    assert match["tier"] in ["Excellent Match", "Best Match", "Strong Match"]
    assert len(match["explanation"]["matched_skills"]) >= 3
    assert "why_match" in match["explanation"]
    assert "why_not_perfect" in match["explanation"]

def test_india_geo_and_verification():
    from app.services.geo_service import haversine_distance_km, resolve_location_coordinates
    from app.services.verification_service import verification_service
    
    # Pune to Hinjewadi distance check
    lat1, lng1, _ = resolve_location_coordinates("Pune")
    lat2, lng2, _ = resolve_location_coordinates("Pune", "Hinjewadi")
    dist = haversine_distance_km(lat1, lng1, lat2, lng2)
    assert dist < 20.0 # Hinjewadi is ~14 km from central Pune

    # Domain authenticity validation
    assert verification_service.is_authentic_domain("https://internship.aicte-india.org/apply") == True
    assert verification_service.is_authentic_domain("https://careers.google.com/jobs/results") == True
    assert verification_service.is_authentic_domain("https://fake-shady-site.biz/job") == False

def test_resume_service_parsing():
    sample_resume = """
    Alex Mercer
    Senior Software Engineer - 4 years of experience
    Experience:
    - Built high-throughput microservices using Python, FastAPI, and PostgreSQL.
    - Designed RAG pipelines with LangChain and pgvector, reducing search latency by 35%.
    - Containerized applications using Docker and deployed onto AWS.
    Education:
    - B.S. in Computer Science
    Projects & Skills:
    - Skills: Python, FastAPI, PostgreSQL, Docker, AWS, RAG, LangChain, Git
    """

    analysis = resume_service.analyze_resume_text(sample_resume)
    assert "Python" in analysis["skills"]
    assert "FastAPI" in analysis["skills"]
    assert analysis["strength_score"] > 60.0
    assert analysis["estimated_years_experience"] >= 3.0
    assert len(analysis["recommended_improvements"]) >= 1
