# backend/agents/attendance_agent.py
from ihrms_db import AsyncSessionLocal, EmpAttendance, Holiday
from sqlalchemy import select, desc
import logging
logger = logging.getLogger(__name__)

class AttendanceAgent:
    @staticmethod
    async def fetch(message: str) -> tuple[str, list]:
        tool_calls = []
        lines = []
        async with AsyncSessionLocal() as session:
            try:
                q = select(EmpAttendance).order_by(desc(EmpAttendance.day)).limit(15)
                result = await session.execute(q)
                records = result.scalars().all()
                tool_calls.append({"tool":"fetch_attendance","args":{"limit":15},"result":f"{len(records)} attendance records fetched"})
                if records:
                    lines.append("=== ATTENDANCE RECORDS (hrms.emp_attendance) ===")
                    status_map = {0:"Pending",1:"Present",2:"Absent",3:"Half Day",4:"Approved"}
                    for a in records:
                        lines.append(f"EmpID: {a.emp_id} | Date: {str(a.day)[:10] if a.day else 'N/A'} | "
                                     f"In: {a.intime} | Out: {a.outtime} | Status: {status_map.get(a.status, str(a.status))}")

                q2 = select(Holiday).order_by(desc(Holiday.day)).limit(10)
                result2 = await session.execute(q2)
                holidays = result2.scalars().all()
                if holidays:
                    lines.append("\n=== HOLIDAYS (hrms.holiday) ===")
                    for h in holidays:
                        lines.append(f"{str(h.day)[:10] if h.day else 'N/A'} — {h.holiday_title}")

            except Exception as e:
                logger.error(f"AttendanceAgent error: {e}")
                lines.append(f"DB fetch error: {e}")
        return "\n".join(lines), tool_calls
