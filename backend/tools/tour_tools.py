# backend/tools/tour_tools.py
from ihrms_db import fetch_all, TourRequest

CITY_CLASS = {"Delhi":"A","Mumbai":"A","Bengaluru":"A","Chennai":"A"}
DA_RATES   = {"A":3900, "B":2800, "C":2000}  # per SR rules

async def get_tour_requests(status: str = None) -> list:
    filters = []
    if status: filters.append(TourRequest.status == status)
    tours = await fetch_all(TourRequest, filters=filters)
    return [
        {
            "tour_id": t.tour_id, "emp_id": t.emp_id,
            "dest": t.destination, "from": str(t.from_date),
            "to": str(t.to_date), "purpose": t.purpose,
            "status": t.status, "sanction_no": t.sanction_no
        }
        for t in tours
    ]

async def calculate_tada(
    destination: str, days: int, grade_pay: float
) -> dict:
    city_class = CITY_CLASS.get(destination, "B")
    da_per_day = DA_RATES[city_class]
    da_total   = da_per_day * days
    ta_estimate = 3500 if grade_pay >= 4600 else 2500
    return {
        "destination": destination,
        "city_class": city_class,
        "da_per_day": da_per_day, "da_total": da_total,
        "ta_estimate": ta_estimate,
        "total": da_total + ta_estimate,
        "advance_required": (da_total + ta_estimate) > 10000
    }