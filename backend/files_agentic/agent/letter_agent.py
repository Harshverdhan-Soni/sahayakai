# backend/agents/letter_agent.py
from ihrms_db import AsyncSessionLocal, Letters
from sqlalchemy import select, desc
import logging
logger = logging.getLogger(__name__)

class LetterAgent:
    @staticmethod
    async def fetch(message: str) -> tuple[str, list]:
        tool_calls = []
        lines = []
        async with AsyncSessionLocal() as session:
            try:
                q = select(Letters).order_by(desc(Letters.letter_date)).limit(10)
                result = await session.execute(q)
                records = result.scalars().all()
                tool_calls.append({"tool":"fetch_letters","args":{"limit":10},"result":f"{len(records)} letters fetched from hrms.letters"})
                if records:
                    lines.append("=== RECENT LETTERS/CIRCULARS (hrms.letters) ===")
                    for l in records:
                        lines.append(f"ID: {l.letter_id} | No: {l.letter_no} | "
                                     f"Date: {str(l.letter_date)[:10] if l.letter_date else 'N/A'} | "
                                     f"Subject: {l.subject} | From: {l.sent_from} | To: {l.sent_to}")
                else:
                    lines.append("No letters found in hrms.letters")
            except Exception as e:
                logger.error(f"LetterAgent error: {e}")
                lines.append(f"DB fetch error: {e}")
        return "\n".join(lines), tool_calls
