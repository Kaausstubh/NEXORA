import io
import docx
import pytest
from app.services.resume_service import resume_service

def test_docx_resume_parsing():
    # Build in-memory docx resume
    doc = docx.Document()
    doc.add_heading("Kaustubh Sharma - AI Systems Engineer", 0)
    doc.add_paragraph("Email: kaustubh@example.com | Phone: +91 98765 43210 | GitHub: github.com/kaustubh | LinkedIn: linkedin.com/in/kaustubh")
    doc.add_heading("Professional Summary", 1)
    doc.add_paragraph("Senior Python & AI Engineer with 4.5 years of experience architecting RAG systems, FastAPI microservices, and LangGraph multi-agent workflows.")
    doc.add_heading("Technical Skills", 1)
    doc.add_paragraph("Languages & Frameworks: Python, FastAPI, TypeScript, React, Docker, Kubernetes, PostgreSQL, pgvector, LangChain, LangGraph, Redis, Kafka, AWS.")
    doc.add_heading("Experience", 1)
    doc.add_paragraph("Engineered real-time vector search pipeline using pgvector, reducing query latency by 45% and scaling to 100k daily queries.")
    doc.add_heading("Education", 1)
    doc.add_paragraph("B.Tech in Computer Science and Engineering, Graduated 2021.")
    
    buf = io.BytesIO()
    doc.save(buf)
    file_bytes = buf.getvalue()

    # Test extract_text with .docx
    extracted = resume_service.extract_text(file_bytes, "kaustubh_resume.docx")
    assert "Kaustubh Sharma" in extracted
    assert "FastAPI" in extracted
    assert "pgvector" in extracted

    # Test analysis
    analysis = resume_service.analyze_resume_text(extracted)
    assert "Python" in analysis["skills"]
    assert "FastAPI" in analysis["skills"]
    assert "LangChain" in analysis["skills"]
    assert "pgvector" in analysis["skills"]
    assert analysis["candidate_role"] in ["AI Backend Engineer", "Backend Engineer"]
    assert analysis["strength_score"] >= 75.0
    assert analysis["contact_extracted"]["email"] == "kaustubh@example.com"
    assert analysis["contact_extracted"]["has_github"] is True
    print("DOCX resume test passed with score:", analysis["strength_score"])

def test_txt_resume_parsing():
    txt_content = """
    Priya Patel - Full Stack Developer
    Email: priya.patel@gmail.com | Phone: +91 91234 56789 | github.com/priyapatel
    Experience: 3 years of experience in React, Next.js, TypeScript, Node.js, and PostgreSQL.
    Education: B.Tech in Computer Science, 2022.
    Achievements: Scaled web application to 20k active users, improved Lighthouse score by 40%.
    """
    file_bytes = txt_content.encode("utf-8")
    extracted = resume_service.extract_text(file_bytes, "priya_resume.txt")
    assert "Priya Patel" in extracted

    analysis = resume_service.analyze_resume_text(extracted)
    assert "React" in analysis["skills"]
    assert "TypeScript" in analysis["skills"]
    assert "PostgreSQL" in analysis["skills"]
    assert analysis["estimated_years_experience"] == 3.0
    assert analysis["contact_extracted"]["email"] == "priya.patel@gmail.com"
    print("TXT resume test passed with skills:", analysis["skills"])
