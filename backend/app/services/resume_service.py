import re
import io
import logging
from typing import Dict, Any, List, Tuple, Optional
from pypdf import PdfReader

try:
    import docx
except ImportError:
    docx = None

logger = logging.getLogger("resume_service")

COMPREHENSIVE_TECH_SKILLS = [
    # AI / ML & Modern Data
    "Machine Learning", "Deep Learning", "LLMs", "RAG", "LangChain", "LangGraph",
    "pgvector", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-learn",
    "NLP", "Computer Vision", "OpenCV", "Hugging Face", "Transformers",
    "Vector Databases", "ChromaDB", "Pinecone", "FAISS", "Weaviate", "Data Science",
    "Prompt Engineering",

    # Core Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "SQL", "HTML5", "CSS3", "Bash", "Shell", "Kotlin", "Swift", "PHP", "Ruby",

    # Backend & APIs
    "FastAPI", "Django", "Flask", "Spring Boot", "Node.js", "Express", "NestJS",
    "REST APIs", "GraphQL", "gRPC", "Microservices", "Celery",

    # Frontend & Mobile
    "React", "Next.js", "Vue.js", "Angular", "Tailwind CSS", "Redux",
    "React Native", "Flutter",

    # Cloud & DevOps
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD",
    "GitHub Actions", "GitLab CI", "Jenkins", "Linux", "Nginx", "Git",
    "Prometheus", "Grafana", "Ansible",

    # Databases & Caching & Streaming
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "RabbitMQ",
    "Elasticsearch", "DynamoDB", "SQLite", "Supabase", "Firebase",

    # Architecture & Testing
    "System Design", "Distributed Systems", "Pytest", "Jest", "Selenium",
    "TDD", "Unit Testing", "Agile", "Scrum"
]

class ResumeService:
    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Universal text extractor supporting PDF, DOCX, TXT, and DOC formats.
        """
        ext = filename.lower().split(".")[-1] if "." in filename else ""

        if ext == "pdf":
            return self.extract_text_from_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            return self.extract_text_from_docx(file_bytes)
        elif ext in ["txt", "text", "md", "csv"]:
            return self.extract_text_from_txt(file_bytes)
        else:
            # Fallback strategy: try PDF first, then DOCX, then TXT
            try:
                return self.extract_text_from_pdf(file_bytes)
            except Exception:
                try:
                    return self.extract_text_from_docx(file_bytes)
                except Exception:
                    return self.extract_text_from_txt(file_bytes)

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_parts.append(extracted)
            full_text = "\n".join(text_parts).strip()
            if not full_text:
                raise ValueError("PDF contains no readable text stream (scanned image or protected).")
            return full_text
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    def extract_text_from_docx(self, file_bytes: bytes) -> str:
        if not docx:
            # Fallback to plain text scan
            return self.extract_text_from_txt(file_bytes)
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            text_parts = []
            
            # Paragraphs
            for p in doc.paragraphs:
                if p.text.strip():
                    text_parts.append(p.text.strip())
            
            # Tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([c.text.strip() for c in row.cells if c.text.strip()])
                    if row_text:
                        text_parts.append(row_text)

            full_text = "\n".join(text_parts).strip()
            if not full_text:
                raise ValueError("DOCX document contains no text.")
            return full_text
        except Exception as e:
            # Fallback to binary string extraction
            try:
                return self.extract_text_from_doc_fallback(file_bytes)
            except Exception:
                raise ValueError(f"Failed to parse Word document: {str(e)}")

    def extract_text_from_txt(self, file_bytes: bytes) -> str:
        for enc in ["utf-8", "latin-1", "cp1252", "iso-8859-1"]:
            try:
                decoded = file_bytes.decode(enc).strip()
                if decoded:
                    return decoded
            except UnicodeDecodeError:
                continue
        return file_bytes.decode("utf-8", errors="ignore").strip()

    def extract_text_from_doc_fallback(self, file_bytes: bytes) -> str:
        """Extracts ASCII/Unicode printable string fragments from legacy .doc or unrecognized binary files."""
        text_matches = re.findall(rb'[\x20-\x7E\t\r\n]{4,}', file_bytes)
        if text_matches:
            extracted = "\n".join([m.decode('latin-1', errors='ignore') for m in text_matches])
            return extracted.strip()
        raise ValueError("Could not extract legible text from binary document.")

    def analyze_resume_text(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        
        # 1. Extract technical skills
        extracted_skills = []
        for skill in COMPREHENSIVE_TECH_SKILLS:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                extracted_skills.append(skill)

        # 2. Extract links and contact signals
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}', text)
        has_github = "github.com" in text_lower or "github" in text_lower
        has_linkedin = "linkedin.com" in text_lower or "linkedin" in text_lower
        has_portfolio = "portfolio" in text_lower or ".dev" in text_lower or ".me" in text_lower

        # 3. Extract experience estimate
        exp_matches = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', text_lower)
        estimated_years = 2.0
        if exp_matches:
            try:
                estimated_years = float(exp_matches[0])
            except ValueError:
                pass
        else:
            # Check date ranges like 2021 - 2024 or 2019 to Present
            date_ranges = re.findall(r'(201\d|202\d)\s*[-–to]+\s*(202\d|present)', text_lower)
            if date_ranges:
                estimated_years = min(15.0, max(1.0, len(date_ranges) * 1.5))

        # 4. Detect candidate role
        detected_role = "Software Engineer"
        role_candidates = [
            ("AI Backend Engineer", ["ai backend", "llm engineer", "rag engineer", "langchain", "generative ai engineer"]),
            ("Machine Learning Engineer", ["machine learning engineer", "ml engineer", "deep learning", "nlp engineer"]),
            ("Backend Engineer", ["backend engineer", "python developer", "backend developer", "api developer", "java developer"]),
            ("Full Stack Developer", ["full stack", "fullstack", "frontend & backend"]),
            ("Frontend Engineer", ["frontend engineer", "frontend developer", "react developer", "ui developer"]),
            ("DevOps Engineer", ["devops engineer", "cloud engineer", "site reliability engineer", "sre", "platform engineer"]),
            ("Data Engineer", ["data engineer", "data platform engineer", "etl developer"]),
            ("Data Scientist", ["data scientist", "data analyst", "statistical analysis"]),
            ("Mobile Developer", ["android developer", "ios developer", "flutter developer", "react native developer"])
        ]
        for role_name, aliases in role_candidates:
            if any(alias in text_lower for alias in aliases):
                detected_role = role_name
                break

        # 5. Extract education indicators
        education_items = []
        if "b.tech" in text_lower or "bachelor of technology" in text_lower:
            education_items.append("B.Tech in Computer Science / Engineering")
        elif "b.e." in text_lower or "bachelor of engineering" in text_lower:
            education_items.append("B.E. in Computer Science / Information Technology")
        elif "b.s." in text_lower or "bachelor of science" in text_lower or "b.sc" in text_lower:
            education_items.append("B.S. in Computer Science / STEM")
        elif "bca" in text_lower:
            education_items.append("Bachelor of Computer Applications (BCA)")

        if "m.tech" in text_lower:
            education_items.append("M.Tech in Advanced Computer Science")
        elif "m.s." in text_lower or "master of science" in text_lower or "m.sc" in text_lower:
            education_items.append("M.S. in Computer Science / AI")
        elif "mca" in text_lower:
            education_items.append("Master of Computer Applications (MCA)")

        # Graduation year check
        grad_year_match = re.search(r'\b(201\d|202\d|203\d)\b', text)
        grad_year = int(grad_year_match.group(1)) if grad_year_match else None

        # 6. Quantifiable metrics & achievements
        metric_matches = re.findall(
            r'(\d+%\s*(?:increase|reduction|improvement|growth|boost|decrease)|\$\d+[km]?|₹\d+[km]?|\d+x|\breduced\b|\bscaled\b|\boptimized\b|\baccelerated\b|\bprocessed\s+\d+)',
            text_lower
        )

        # 7. Section analysis
        sections = {
            "Summary / Objective": any(k in text_lower for k in ["summary", "profile", "objective", "about me"]),
            "Work Experience": any(k in text_lower for k in ["experience", "employment", "work history"]),
            "Technical Skills": any(k in text_lower for k in ["skills", "technologies", "competencies", "tech stack"]),
            "Projects": any(k in text_lower for k in ["projects", "personal projects", "open source"]),
            "Education": any(k in text_lower for k in ["education", "academics", "university", "college", "degree"]),
            "Certifications": any(k in text_lower for k in ["certifications", "licenses", "certificates"])
        }

        # 8. Action Verbs analysis
        action_verbs = ["engineered", "architected", "deployed", "scaled", "optimized", "implemented", "developed", "spearheaded", "designed", "automated", "built"]
        found_action_verbs = [v for v in action_verbs if v in text_lower]

        # 9. Calculate Resume Strength Score (0 to 100)
        strength = 40.0
        # Skills score (up to 25 pts)
        strength += min(25.0, len(extracted_skills) * 1.5)
        # Quantifiable impact (up to 15 pts)
        strength += min(15.0, len(metric_matches) * 3.0)
        # Action verbs (up to 10 pts)
        strength += min(10.0, len(found_action_verbs) * 2.0)
        # Structural completeness (up to 15 pts)
        sec_count = sum(1 for present in sections.values() if present)
        strength += min(15.0, sec_count * 2.5)
        # Contact & professional profiles (up to 10 pts)
        if has_github:
            strength += 5.0
        if has_linkedin:
            strength += 5.0
        if email_match and phone_match:
            strength += 5.0

        strength_score = round(min(98.0, max(45.0, strength)), 1)

        # 10. Recommended improvements tailored to candidate
        improvements = []
        if len(metric_matches) < 3:
            improvements.append("Quantify your achievements using specific metrics (e.g., 'reduced API response latency by 35%', 'scaled system to 50k+ daily queries').")
        if not has_github and not has_portfolio:
            improvements.append("Include your GitHub or portfolio URL to showcase open-source contributions and production code repositories.")
        if "pgvector" not in extracted_skills and "langchain" not in extracted_skills and "ai" in detected_role.lower():
            improvements.append("Highlight modern AI/RAG tooling (LangChain, LangGraph, pgvector, Vector DBs) to stand out for AI Engineering roles.")
        if "docker" not in [s.lower() for s in extracted_skills] and "kubernetes" not in [s.lower() for s in extracted_skills]:
            improvements.append("Add containerization and CI/CD deployment details (Docker, Kubernetes, GitHub Actions) to demonstrate production readiness.")
        if not sections["Summary / Objective"]:
            improvements.append("Add an impactful 2-3 line Executive Summary outlining your core engineering strengths and domain focus.")
        if len(found_action_verbs) < 3:
            improvements.append("Use strong action verbs (Engineered, Architected, Automated, Scaled) at the start of experience bullet points.")
        if len(improvements) < 2:
            improvements.append("Tailor your technical keywords specifically to target job descriptions to maximize ATS match score.")

        # 11. Suitable job categories
        suitable_categories = [detected_role]
        if "Python" in extracted_skills and any(ai_skill in extracted_skills for ai_skill in ["LLMs", "RAG", "LangChain", "Machine Learning"]):
            suitable_categories.append("AI Backend Engineer")
            suitable_categories.append("RAG & LLM Systems Engineer")
        if "FastAPI" in extracted_skills or "PostgreSQL" in extracted_skills:
            suitable_categories.append("Cloud Backend Engineer")
        if "React" in extracted_skills or "Next.js" in extracted_skills:
            suitable_categories.append("Full Stack Developer")
        if "Docker" in extracted_skills or "AWS" in extracted_skills:
            suitable_categories.append("DevOps / Cloud Engineer")

        # Deduplicate
        suitable_categories = list(dict.fromkeys(suitable_categories))

        return {
            "candidate_role": detected_role,
            "estimated_years_experience": estimated_years,
            "skills": extracted_skills,
            "education": education_items or ["Degree in Computer Science or Software Engineering"],
            "graduation_year": grad_year,
            "contact_extracted": {
                "email": email_match.group(0) if email_match else None,
                "phone": phone_match.group(0) if phone_match else None,
                "has_github": has_github,
                "has_linkedin": has_linkedin
            },
            "sections_detected": sections,
            "strength_score": strength_score,
            "experience_summary": f"Identified approximately {estimated_years:.1f} years of engineering experience with strong specialization in {detected_role}.",
            "recommended_improvements": improvements,
            "suitable_job_categories": suitable_categories
        }

resume_service = ResumeService()