from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXORA – AI Career Intelligence Platform"
    TAGLINE: str = "Find Your Fit. Build Your Future."
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://kaustubh@localhost:5432/nexora_db"
    )
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexora-super-secret-production-key-2026-very-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI / LLM Configuration
    # Supported: "local" (deterministic high-fidelity fallback), "openai", "gemini", "ollama"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    EMBEDDING_DIMENSION: int = 384
    
    # Hybrid Ranking Weights (Configurable)
    WEIGHT_SEMANTIC: float = 0.60
    WEIGHT_SKILL: float = 0.25
    WEIGHT_EXPERIENCE: float = 0.10
    WEIGHT_LOCATION: float = 0.05
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
