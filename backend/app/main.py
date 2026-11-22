from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import auth, profiles, jobs, matching, agent, resumes, analytics, fraud
from app.utils.seed_data import seed_jobs_database
from app.services.fraud_detection_service import seed_and_enrich_fraud_data

# Create all database tables immediately
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed database with realistic jobs if needed
    db = SessionLocal()
    try:
        await seed_jobs_database(db, force=False)
        seed_and_enrich_fraud_data(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Career Intelligence Platform. Tagline: 'Find Your Fit. Build Your Future.'",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profiles.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(matching.router, prefix=settings.API_V1_STR)
app.include_router(agent.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(fraud.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "NEXORA",
        "tagline": "Find Your Fit. Build Your Future.",
        "category": "AI-Powered Career Intelligence Platform",
        "status": "operational",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "nexora-backend",
        "ai_provider": settings.AI_PROVIDER
    }
