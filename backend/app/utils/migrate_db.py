import logging
from sqlalchemy import text
from app.core.database import engine, Base
import app.models.entities # ensures all models are registered

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration")

def migrate():
    logger.info("Ensuring all tables exist...")
    Base.metadata.create_all(bind=engine)
    
    # Run column additions if not exist
    alter_statements = [
        # Jobs table
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_type VARCHAR(100) DEFAULT 'Product-based'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locality VARCHAR(100)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS opportunity_type VARCHAR(50) DEFAULT 'Internship'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50) DEFAULT 'Remote'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remote_details VARCHAR(150) DEFAULT 'Work from anywhere in India'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stipend_type VARCHAR(50) DEFAULT 'Fixed stipend'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stipend_amount_min INTEGER",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stipend_amount_max INTEGER",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stipend_currency VARCHAR(10) DEFAULT 'INR'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 3",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ppo_availability VARCHAR(50) DEFAULT 'No PPO Mentioned'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ppo_terms VARCHAR(255)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ppo_eligible_criteria VARCHAR(255)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS eligibility_criteria JSON DEFAULT '[]'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_platform VARCHAR(100) DEFAULT 'Official Portal'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_url VARCHAR(512)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'Verified'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITHOUT TIME ZONE",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS trust_badge VARCHAR(50) DEFAULT 'Verified Employer'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fraud_risk_score INTEGER DEFAULT 10",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fraud_risk_level VARCHAR(50) DEFAULT 'Low Risk'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_fee_required BOOLEAN DEFAULT FALSE",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_application_blocked BOOLEAN DEFAULT FALSE",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS block_reason TEXT",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(150)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_email VARCHAR(150)",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_verification VARCHAR(50) DEFAULT 'Verified'",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_safety_audit TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()",

        # Companies table
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS cin VARCHAR(50)",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS gstin VARCHAR(50)",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS domain VARCHAR(255)",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS mca_status VARCHAR(50) DEFAULT 'Active'",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS incorporation_year INTEGER",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_structure VARCHAR(100) DEFAULT 'Private Limited (Pvt Ltd)'",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS registered_office TEXT",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS trust_badge VARCHAR(50) DEFAULT 'Verified Employer'",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 85",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS fraud_risk_score INTEGER DEFAULT 10",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS fraud_risk_level VARCHAR(50) DEFAULT 'Low Risk'",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS blacklist_reason TEXT",
        
        # Candidate Profiles table
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS locality VARCHAR(100)",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS min_stipend_expectation INTEGER DEFAULT 10000",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS graduation_year INTEGER",
        "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS degree VARCHAR(100)",

        # Match history table
        "ALTER TABLE match_history ADD COLUMN IF NOT EXISTS match_category VARCHAR(50) DEFAULT 'Strong Match'",

        # Indexes
        "CREATE INDEX IF NOT EXISTS ix_jobs_country ON jobs(country)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_city ON jobs(city)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_state ON jobs(state)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_work_mode ON jobs(work_mode)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_verification_status ON jobs(verification_status)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_opportunity_type ON jobs(opportunity_type)",
        "CREATE INDEX IF NOT EXISTS ix_jobs_ppo_availability ON jobs(ppo_availability)"
    ]

    with engine.begin() as conn:
        for stmt in alter_statements:
            conn.execute(text(stmt))
    logger.info("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
