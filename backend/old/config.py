# backend/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # iHRMS PostgreSQL
    DATABASE_URL:   str = "postgresql+asyncpg://postgres:cdacsil@localhost:5434/hrmis"
    IHRMS_SCHEMA:   str = "hrms"       # schema with 78 tables

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL:    str = "llama3.2"

    # FastAPI
    API_HOST:    str = "0.0.0.0"
    API_PORT:    int = 8000
    SECRET_KEY:  str = "sahayak-dev-secret-change-in-production"

    # Audit
    AUDIT_DB_PATH: str = "./audit.db"

    class Config:
        env_file = ".env"
        extra    = "ignore"

settings = Settings()
