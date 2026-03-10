# backend/main.py
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from config import settings
from mcp_server import mcp
from audit import audit_log, get_audit_log
from scheduler import get_pending_notifications, mark_notif_seen
from tools import register_all_tools

app = FastAPI(title="SAHAYAK-AI MCP Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    register_all_tools()     # register all MCP tools
    print("[SAHAYAK-AI] MCP Server ready. Tools:", len(mcp._tools))

# ── Request / Response models ─────────────────────────────────────
class ChatRequest(BaseModel):
    message:    str
    officer_id: str = "AK10234"
    history:    list = []

class ApprovalRequest(BaseModel):
    action_id:  str
    officer_id: str
    decision:   str      # "approved" | "rejected"
    reason:     Optional[str] = None

# ── Endpoints ─────────────────────────────────────────────────────
@app.get("/")
async def health():
    return {"status": "running", "tools": len(mcp._tools)}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Main chat endpoint — runs MCP agent loop, returns response."""
    try:
        result = await mcp.run_agent(
            prompt=req.message,
            officer_id=req.officer_id,
            conversation_history=req.history
        )
        return {"ok": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notifications")
async def get_notifications(officer_id: str = "AK10234"):
    """Return pending proactive notifications for this officer."""
    return {"notifications": await get_pending_notifications(officer_id)}

@app.post("/api/notifications/{notif_id}/seen")
async def mark_seen(notif_id: str, officer_id: str = "AK10234"):
    await mark_notif_seen(notif_id, officer_id)
    return {"ok": True}

@app.post("/api/approve")
async def approve_action(req: ApprovalRequest):
    """Log HITL approval / rejection to immutable audit trail."""
    await audit_log(
        officer_id=req.officer_id,
        action=f"hitl:{req.decision}:{req.action_id}",
        details={"reason": req.reason},
        ai_generated=False
    )
    return {"ok": True, "logged": True}

@app.get("/api/audit")
async def audit(officer_id: str = None, limit: int = 100):
    return {"logs": await get_audit_log(officer_id=officer_id, limit=limit)}

@app.get("/api/tools")
async def tools():
    return {"tools": mcp.list_tools()}

# ── WebSocket: streaming chat ─────────────────────────────────────
@app.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = json.loads(await websocket.receive_text())
            async for chunk in mcp.stream_agent(data["message"], data.get("officer_id")):
                await websocket.send_text(json.dumps({"chunk": chunk}))
            await websocket.send_text(json.dumps({"done": True}))
    except Exception:
        await websocket.close()