# backend/config.py
from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
    DB_URL       = (
        f"postgresql+asyncpg://"
        f"{os.getenv('IHRMS_DB_USER')}:{os.getenv('IHRMS_DB_PASSWORD')}"
        f"@{os.getenv('IHRMS_DB_HOST')}:{os.getenv('IHRMS_DB_PORT')}"
        f"/{os.getenv('IHRMS_DB_NAME')}"
    )
    AUDIT_DB     = os.getenv("AUDIT_DB_PATH", "./audit.db")
    SECRET_KEY   = os.getenv("SECRET_KEY", "change-me")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

settings = Settings()