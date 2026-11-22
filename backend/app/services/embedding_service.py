import re
import math
import hashlib
from typing import List, Optional
import httpx
from app.core.config import settings

# Semantic taxonomy clusters for deterministic dense embeddings
TECH_CLUSTERS = {
    "ai_ml": [
        "python", "fastapi", "machine learning", "deep learning", "llm", "llms", "rag", 
        "langchain", "langgraph", "vector", "pgvector", "embeddings", "pytorch", 
        "tensorflow", "huggingface", "transformers", "nlp", "prompt engineering", "openai", "claude"
    ],
    "backend": [
        "python", "fastapi", "django", "flask", "golang", "java", "spring", "nodejs", 
        "express", "postgresql", "sql", "redis", "kafka", "microservices", "rest api", 
        "graphql", "docker", "kubernetes", "grpc", "orm", "sqlalchemy"
    ],
    "frontend": [
        "javascript", "typescript", "react", "nextjs", "vue", "angular", "tailwind", 
        "css", "html", "redux", "zustand", "framer motion", "shadcn", "webpack", "vite"
    ],
    "cloud_devops": [
        "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "terraform", "ansible", 
        "linux", "bash", "prometheus", "grafana", "git", "github actions", "helm"
    ],
    "data_engineering": [
        "python", "sql", "spark", "hadoop", "airflow", "snowflake", "bigquery", 
        "dbt", "etl", "data warehouse", "pandas", "numpy", "databricks"
    ]
}

def normalize_l2(vector: List[float]) -> List[float]:
    norm = math.sqrt(sum(x * x for x in vector))
    if norm < 1e-9:
        return vector
    return [round(x / norm, 6) for x in vector]

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 < 1e-9 or norm2 < 1e-9:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))

class EmbeddingService:
    def __init__(self):
        self.dimension = settings.EMBEDDING_DIMENSION

    def _generate_deterministic_embedding(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional dense semantic vector from text.
        Incorporates semantic cluster activation, term hashing, and n-gram projections
        yielding realistic cosine similarity for technical profiles and job descriptions.
        """
        text_lower = text.lower()
        vector = [0.0] * self.dimension
        
        # 1. Cluster activation (dimensions 0-99 reserved for cluster semantic mapping)
        cluster_names = list(TECH_CLUSTERS.keys())
        for idx, (cluster_name, keywords) in enumerate(TECH_CLUSTERS.items()):
            base_offset = idx * 20
            match_count = sum(1 for kw in keywords if kw in text_lower)
            if match_count > 0:
                cluster_weight = math.log1p(match_count) * 2.5
                for sub in range(20):
                    dim = base_offset + sub
                    vector[dim] += cluster_weight * (0.8 + 0.4 * math.sin(sub * 1.5))

        # 2. Token hashing & n-gram projection (dimensions 100-383)
        tokens = re.findall(r'\b[a-zA-Z0-9_\-+#]{2,}\b', text_lower)
        for token in tokens:
            token_hash = int(hashlib.sha256(token.encode('utf-8')).hexdigest()[:8], 16)
            dim = 100 + (token_hash % (self.dimension - 100))
            sign = 1.0 if ((token_hash >> 4) & 1) else -0.5
            vector[dim] += sign * 1.0

        # 3. Bigram context hashing
        if len(tokens) >= 2:
            for i in range(len(tokens) - 1):
                bigram = f"{tokens[i]}_{tokens[i+1]}"
                b_hash = int(hashlib.md5(bigram.encode('utf-8')).hexdigest()[:8], 16)
                dim = 100 + (b_hash % (self.dimension - 100))
                vector[dim] += 0.75

        return normalize_l2(vector)

    async def _get_openai_embedding(self, text: str) -> Optional[List[float]]:
        if not settings.OPENAI_API_KEY:
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"input": text[:8000], "model": "text-embedding-3-small", "dimensions": self.dimension}
                )
                if res.status_code == 200:
                    data = res.json()
                    return normalize_l2(data["data"][0]["embedding"])
        except Exception:
            pass
        return None

    async def _get_gemini_embedding(self, text: str) -> Optional[List[float]]:
        if not settings.GEMINI_API_KEY:
            return None
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    url,
                    json={"model": "models/text-embedding-004", "content": {"parts": [{"text": text[:8000]}]}}
                )
                if res.status_code == 200:
                    data = res.json()
                    raw = data.get("embedding", {}).get("values", [])
                    if raw:
                        # Slice or project to dimension
                        sliced = raw[:self.dimension] if len(raw) >= self.dimension else raw + [0.0]*(self.dimension - len(raw))
                        return normalize_l2(sliced)
        except Exception:
            pass
        return None

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates an embedding vector using the configured provider or fallback.
        """
        clean_text = text.strip() if text else ""
        if not clean_text:
            return [0.0] * self.dimension

        if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            vec = await self._get_openai_embedding(clean_text)
            if vec:
                return vec

        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            vec = await self._get_gemini_embedding(clean_text)
            if vec:
                return vec

        # Deterministic semantic fallback
        return self._generate_deterministic_embedding(clean_text)

    def build_candidate_text(
        self,
        current_role: Optional[str],
        experience_years: float,
        preferred_roles: List[str],
        skills: List[str],
        bio: Optional[str] = None
    ) -> str:
        parts = []
        if current_role:
            parts.append(f"Current Role: {current_role}")
        parts.append(f"Experience: {experience_years} years")
        if preferred_roles:
            parts.append(f"Target Roles: {', '.join(preferred_roles)}")
        if skills:
            parts.append(f"Technical & Domain Skills: {', '.join(skills)}")
        if bio:
            parts.append(f"Background: {bio}")
        return "\n".join(parts)

    def build_job_text(
        self,
        title: str,
        company: str,
        description: str,
        required_skills: List[str],
        preferred_skills: List[str] = None,
        responsibilities: List[str] = None
    ) -> str:
        parts = [
            f"Job Title: {title}",
            f"Company: {company}",
            f"Description: {description}",
            f"Required Skills: {', '.join(required_skills or [])}"
        ]
        if preferred_skills:
            parts.append(f"Preferred Skills: {', '.join(preferred_skills)}")
        if responsibilities:
            parts.append(f"Responsibilities: {'; '.join(responsibilities)}")
        return "\n".join(parts)

embedding_service = EmbeddingService()
