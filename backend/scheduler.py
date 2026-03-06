# backend/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import date, timedelta
import uuid, json

# In-memory notification store (replace with DB for production)
_notifications: dict[str, list] = {}

scheduler = AsyncIOScheduler()

# ── Monitoring jobs ───────────────────────────────────────────────
async def check_rti_deadlines_job():
    from ihrms_db import fetch_all, RTIApplication
    rtis = await fetch_all(RTIApplication, [RTIApplication.status == "Open"])
    for rti in rtis:
        days_left = (rti.due_date - date.today()).days
        if 0 <= days_left <= 5:
            await push_notification(
                officer_id=rti.assigned_to,
                notif={
                    "id": f"rti-{rti.rti_id}-{date.today()}",
                    "type": "urgent" if days_left <= 3 else "warning",
                    "agent": "RTI Deadline Monitor",
                    "title": f"RTI Deadline in {days_left} day(s)",
                    "body": f"{rti.rti_id}: {rti.subject[:80]}. Due: {rti.due_date}",
                    "cta": "Draft reply now",
                    "ctaPrompt": f"Draft an RTI reply for application {rti.rti_id}",
                    "ref": rti.rti_id, "icon": "⚖️", "color": "#E53935",
                    "module": "rti"
                }
            )

async def check_leave_anomalies_job():
    from tools.leave_tools import detect_leave_anomalies
    anomalies = await detect_leave_anomalies()
    for a in anomalies:
        await push_notification(
            officer_id="AK10234",  # Section officer
            notif={
                "id": f"leave-anomaly-{a['date']}",
                "type": "warning",
                "agent": "Leave Pattern Agent",
                "title": "Leave Cluster Detected",
                "body": f"{a['count']} staff on leave on {a['date']}. {a['flag']}",
                "cta": "Review leave applications",
                "ctaPrompt": "Check leave policy compliance for upcoming leaves",
                "ref": "iHRMS Leave Module", "icon": "🗓", "color": "#F7941D",
                "module": "leave"
            }
        )

async def check_payroll_anomalies_job():
    from tools.hr_tools import validate_payroll
    from datetime import datetime
    issues = await validate_payroll(datetime.now().month, datetime.now().year)
    for issue in issues:
        await push_notification(
            officer_id="AK10234",
            notif={
                "id": f"payroll-{issue['emp_id']}",
                "type": "warning",
                "agent": "iHRMS Data Validator",
                "title": "Payroll Anomaly Detected",
                "body": issue["description"],
                "cta": "View & raise correction",
                "ctaPrompt": "Validate iHRMS employee data and report discrepancies",
                "ref": f"EMD · {issue['emp_id']}", "icon": "👤", "color": "#14B8A6",
                "module": "hrdata"
            }
        )

# ── Notification store helpers ────────────────────────────────────
async def push_notification(officer_id: str, notif: dict):
    if officer_id not in _notifications:
        _notifications[officer_id] = []
    ids = [n["id"] for n in _notifications[officer_id]]
    if notif["id"] not in ids:   # no duplicates
        _notifications[officer_id].insert(0, notif)

async def get_pending_notifications(officer_id: str) -> list:
    return _notifications.get(officer_id, [])

async def mark_notif_seen(notif_id: str, officer_id: str):
    _notifications[officer_id] = [
        n for n in _notifications.get(officer_id, []) if n["id"] != notif_id
    ]

# ── Start all scheduled jobs ──────────────────────────────────────
def start_scheduler():
    scheduler.add_job(check_rti_deadlines_job,    "interval", minutes=15)
    scheduler.add_job(check_leave_anomalies_job,  "interval", minutes=30)
    scheduler.add_job(check_payroll_anomalies_job, "interval", hours=6)
    scheduler.start()
    print("[SAHAYAK-AI] Notification scheduler started")