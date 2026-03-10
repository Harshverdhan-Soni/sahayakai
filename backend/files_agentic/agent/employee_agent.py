# backend/agents/employee_agent.py
from ihrms_db import AsyncSessionLocal, Employee, Designation, EmpPromotion, EmployeePostingHistory, Store
from sqlalchemy import select, desc
import logging
logger = logging.getLogger(__name__)

class EmployeeAgent:
    @staticmethod
    async def fetch(message: str) -> tuple[str, list]:
        tool_calls = []
        lines = []
        async with AsyncSessionLocal() as session:
            try:
                # Recent employees
                q = select(Employee).limit(10)
                result = await session.execute(q)
                employees = result.scalars().all()
                tool_calls.append({"tool":"fetch_employees","args":{"limit":10},"result":f"{len(employees)} employees fetched"})
                if employees:
                    lines.append("=== EMPLOYEES (hrms.employee) ===")
                    for e in employees:
                        lines.append(f"EmpID: {e.emp_id} | Name: {e.first_name} {e.last_name} | "
                                     f"Designation ID: {e.designation} | Store: {e.store_id} | "
                                     f"Status: {'Active' if e.status==1 else 'Inactive'} | "
                                     f"Joining: {str(e.joining_date)[:10] if e.joining_date else 'N/A'} | "
                                     f"Basic Pay: {e.bacic_pay}")

                # Designations
                q2 = select(Designation)
                result2 = await session.execute(q2)
                desigs = result2.scalars().all()
                if desigs:
                    lines.append("\n=== DESIGNATIONS (hrms.designation) ===")
                    for d in desigs:
                        lines.append(f"ID: {d.desig_id} | {d.desig_name} | Grade: {d.grade}")

                # Recent promotions
                q3 = select(EmpPromotion).order_by(desc(EmpPromotion.promotion_date)).limit(5)
                result3 = await session.execute(q3)
                promotions = result3.scalars().all()
                tool_calls.append({"tool":"fetch_promotions","args":{"limit":5},"result":f"{len(promotions)} promotions fetched"})
                if promotions:
                    lines.append("\n=== RECENT PROMOTIONS (hrms.emp_promotion) ===")
                    for p in promotions:
                        lines.append(f"EmpID: {p.emp_id} | Date: {str(p.promotion_date)[:10] if p.promotion_date else 'N/A'} | "
                                     f"Level: {p.level} | Basic: {p.basic}")

            except Exception as e:
                logger.error(f"EmployeeAgent error: {e}")
                lines.append(f"DB fetch error: {e}")
        return "\n".join(lines), tool_calls
