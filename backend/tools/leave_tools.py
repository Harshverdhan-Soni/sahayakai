# backend/tools/leave_tools.py
from ihrms_db import fetch_all, LeaveApplication, LeaveBalance, EmployeeMaster
from datetime import date
from sqlalchemy import select

async def get_leave_applications(
    dept: str = None, status: str = "Pending"
) -> list:
    """Fetch leave applications from iHRMS, optionally filtered."""
    filters = []
    if status: filters.append(LeaveApplication.status == status)
    apps = await fetch_all(LeaveApplication, filters=filters)
    return [
        {
            "leave_id": a.leave_id, "emp_id": a.emp_id,
            "type": a.leave_type, "from": str(a.from_date),
            "to": str(a.to_date), "days": a.days,
            "status": a.status
        }
        for a in apps
    ]

async def check_leave_balance(emp_id: str) -> dict:
    """Get leave balance for an employee from iHRMS."""
    balances = await fetch_all(LeaveBalance, [LeaveBalance.emp_id == emp_id])
    return {b.leave_type: float(b.balance_days) for b in balances}

async def detect_leave_anomalies() -> list:
    """Flag leave cluster patterns (e.g. audit period)."""
    apps = await get_leave_applications(status=None)
    from collections import Counter
    date_counts = Counter()
    for a in apps:
        date_counts[a["from"]] += 1
    return [
        {"date": d, "count": c, "flag": "High absence cluster"}
        for d, c in date_counts.items() if c >= 3
    ]