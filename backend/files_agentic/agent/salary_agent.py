# backend/agents/salary_agent.py
from ihrms_db import AsyncSessionLocal, EmpSalary, EmpDeduction, GradePay
from sqlalchemy import select, desc
import logging
logger = logging.getLogger(__name__)

class SalaryAgent:
    @staticmethod
    async def fetch(message: str) -> tuple[str, list]:
        tool_calls = []
        lines = []
        async with AsyncSessionLocal() as session:
            try:
                q = select(EmpSalary).order_by(desc(EmpSalary.for_month)).limit(10)
                result = await session.execute(q)
                records = result.scalars().all()
                tool_calls.append({"tool":"fetch_salary_records","args":{"limit":10},"result":f"{len(records)} salary records fetched from hrms.emp_salary"})
                if records:
                    lines.append("=== SALARY RECORDS (hrms.emp_salary) ===")
                    for s in records:
                        lines.append(f"EmpID: {s.emp_id} | Month: {str(s.for_month)[:7] if s.for_month else 'N/A'} | "
                                     f"Basic: {s.basic} | Grade Pay: {s.grade_pay} | HRA: {s.hra} | TA: {s.ta} | "
                                     f"DA: {s.dra} | Gross: {s.gross_salary} | Deductions: {s.total_deduction} | Net: {s.net_pay}")

                q2 = select(GradePay)
                result2 = await session.execute(q2)
                gps = result2.scalars().all()
                if gps:
                    lines.append("\n=== GRADE PAY MASTER (hrms.grade_pay) ===")
                    for g in gps:
                        lines.append(f"ID: {g.grade_pay_id} | {g.grade_name} | GP: {g.grade_pay} | Starting: {g.starting_pay}")

                q3 = select(EmpDeduction).limit(10)
                result3 = await session.execute(q3)
                deds = result3.scalars().all()
                tool_calls.append({"tool":"fetch_deductions","args":{"limit":10},"result":f"{len(deds)} deduction records fetched"})
                if deds:
                    lines.append("\n=== DEDUCTIONS (hrms.emp_deduction) ===")
                    for d in deds:
                        lines.append(f"EmpID: {d.emp_id} | EPF: {d.epf} | Tax: {d.direct_tax} | Prof Tax: {d.prof_tax} | LWP: {d.leave_without_pay}")

            except Exception as e:
                logger.error(f"SalaryAgent error: {e}")
                lines.append(f"DB fetch error: {e}")
        return "\n".join(lines), tool_calls
