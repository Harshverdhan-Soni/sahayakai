# backend/main.py
# FastAPI gateway — SAHAYAK-AI backend
# Connects React frontend → Agent Orchestrator → iHRMS DB + Ollama LLM

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging

from ihrms_db import ping_db
from agents.orchestrator import run_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SAHAYAK-AI Backend", version="1.0.0")

# Allow React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response schemas ────────────────────────────────────
class ChatMessage(BaseModel):
    role: str       # "user" or "assistant"
    text: str

class ChatRequest(BaseModel):
    message:  str
    history:  list[ChatMessage] = []
    officer_id: str = "AK10234"

class ChatResponse(BaseModel):
    response:    str
    agent_chain: list[str]
    tool_calls:  list[dict]
    db_context:  Optional[str] = None
    needs_hitl:  bool = False

# ── Startup ───────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    ok = await ping_db()
    if not ok:
        logger.warning("⚠ iHRMS DB not reachable on startup — check Docker container")
    else:
        logger.info("✓ iHRMS DB connected")

# ── Health check ──────────────────────────────────────────────────
@app.get("/")
async def health():
    db_ok = await ping_db()
    return {
        "status":  "running",
        "db":      "connected" if db_ok else "offline",
        "version": "1.0.0"
    }

# ── Main chat endpoint ────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        result = await run_agent(
            message    = req.message,
            history    = [{"role": m.role, "text": m.text} for m in req.history],
            officer_id = req.officer_id,
        )
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
