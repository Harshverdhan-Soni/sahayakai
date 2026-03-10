# backend/agents/grievance_agent.py
from ihrms_db import AsyncSessionLocal, Grievance
from sqlalchemy import select
import logging
logger = logging.getLogger(__name__)

class GrievanceAgent:
    @staticmethod
    async def fetch(message: str) -> tuple[str, list]:
        tool_calls = []
        lines = []
        async with AsyncSessionLocal() as session:
            try:
                q = select(Grievance).limit(15)
                result = await session.execute(q)
                records = result.scalars().all()
                tool_calls.append({"tool":"fetch_grievances","args":{"limit":15},"result":f"{len(records)} grievances fetched from hrms.grievance"})
                status_map = {1:"Open", 2:"In Progress", 3:"Resolved"}
                open_count = sum(1 for r in records if r.status == 1)
                inprog_count = sum(1 for r in records if r.status == 2)
                resolved_count = sum(1 for r in records if r.status == 3)
                lines.append(f"=== GRIEVANCE SUMMARY ===\nTotal: {len(records)} | Open: {open_count} | In Progress: {inprog_count} | Resolved: {resolved_count}")
                lines.append("\n=== GRIEVANCE DETAILS (hrms.grievance) ===")
                for g in records:
                    lines.append(f"ID: {g.complaint_id} | {g.full_name} | Status: {status_map.get(g.status,'Unknown')} | "
                                 f"Summary: {g.complaint_summary or 'N/A'}")
            except Exception as e:
                logger.error(f"GrievanceAgent error: {e}")
                lines.append(f"DB fetch error: {e}")
        return "\n".join(lines), tool_calls
