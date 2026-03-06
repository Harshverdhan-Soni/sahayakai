# backend/audit.py
import aiosqlite, json
from datetime import datetime
from config import settings

async def _get_db():
    db = await aiosqlite.connect(settings.AUDIT_DB)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ts          TEXT NOT NULL,
            officer_id  TEXT NOT NULL,
            action      TEXT NOT NULL,
            details     TEXT,
            ai_generated INTEGER DEFAULT 1
        )
    """)
    await db.commit()
    return db

async def audit_log(
    officer_id: str, action: str,
    details: dict = None, ai_generated: bool = True
):
    db = await _get_db()
    async with db:
        await db.execute(
            "INSERT INTO audit_log (ts,officer_id,action,details,ai_generated) VALUES (?,?,?,?,?)",
            (datetime.now().isoformat(), officer_id, action,
             json.dumps(details or {}), int(ai_generated))
        )
        await db.commit()

async def get_audit_log(officer_id: str = None, limit: int = 100) -> list:
    db = await _get_db()
    q = "SELECT ts,officer_id,action,details,ai_generated FROM audit_log"
    params = []
    if officer_id:
        q += " WHERE officer_id=?"; params.append(officer_id)
    q += f" ORDER BY id DESC LIMIT {limit}"
    async with db.execute(q, params) as cursor:
        rows = await cursor.fetchall()
    return [
        {"ts":r[0],"officer":r[1],"action":r[2],
         "details":json.loads(r[3]),"ai":bool(r[4])}
        for r in rows
    ]