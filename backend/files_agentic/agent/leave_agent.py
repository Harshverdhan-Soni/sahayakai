# backend/agents/leave_agent.py
# Fetches real leave data from hrms.leave_entry + hrms.leave_balance

from ihrms_db import AsyncSessionLocal, LeaveEntry, LeaveBalance, LeaveType, Employee
from sqlalchemy import select, desc
import logging

logger = logging.getLogger(__name__)

class LeaveAgent:
    @staticmethod
    async def fetch(message: str) -> tuple[str, list]:
        """Fetch leave data from iHRMS and return (context_string, tool_calls)"""
        tool_calls = []
        lines = []

        async with AsyncSessionLocal() as session:
            try:
                # ── Fetch recent leave applications ──────────────────
                q = select(LeaveEntry).order_by(desc(LeaveEntry.leave_id)).limit(10)
                result = await session.execute(q)
                entries = result.scalars().all()

                tool_calls.append({
                    "tool":   "fetch_leave_entries",
                    "args":   {"limit": 10, "order": "recent"},
                    "result": f"{len(entries)} leave applications fetched from hrms.leave_entry"
                })

                if entries:
                    lines.append("=== RECENT LEAVE APPLICATIONS (hrms.leave_entry) ===")
                    status_map = {1: "Pending", 2: "Approved", 3: "Rejected", 4: "Cancelled"}
                    for e in entries:
                        status = status_map.get(e.status, str(e.status))
                        lines.append(
                            f"Leave ID: {e.leave_id} | Emp: {e.emp_id} | "
                            f"From: {str(e.leave_from_date)[:10] if e.leave_from_date else 'N/A'} "
                            f"To: {str(e.leave_to_date)[:10] if e.leave_to_date else 'N/A'} | "
                            f"Days: {e.no_of_days} | Status: {status} | "
                            f"Reason: {e.leave_reason or 'N/A'}"
                        )

                # ── Fetch leave balances ──────────────────────────────
                q2 = select(LeaveBalance).limit(20)
                result2 = await session.execute(q2)
                balances = result2.scalars().all()

                tool_calls.append({
                    "tool":   "fetch_leave_balances",
                    "args":   {"limit": 20},
                    "result": f"{len(balances)} leave balance records fetched"
                })

                if balances:
                    lines.append("\n=== LEAVE BALANCES (hrms.leave_balance) ===")
                    for b in balances:
                        lines.append(
                            f"Emp: {b.emp_id} | Type ID: {b.leave_type_id} | "
                            f"Balance: {b.leave_balance} | Available: {b.leave_available} | "
                            f"Pending: {b.leave_pending}"
                        )

                # ── Fetch leave types ─────────────────────────────────
                q3 = select(LeaveType)
                result3 = await session.execute(q3)
                types = result3.scalars().all()
                if types:
                    lines.append("\n=== LEAVE TYPES (hrms.leave_type) ===")
                    for t in types:
                        lines.append(f"ID: {t.leave_type_id} | {t.leave_type} ({t.leave_type_code}) | Max: {t.no_of_days} days")

            except Exception as e:
                logger.error(f"LeaveAgent fetch error: {e}")
                lines.append(f"DB fetch error: {e}")

        return "\n".join(lines), tool_calls
