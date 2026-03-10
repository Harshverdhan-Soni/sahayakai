# backend/ihrms_db.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Integer, Date, Numeric, Boolean, Text, select
from config import settings
from datetime import date

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# ── iHRMS Table Models ────────────────────────────────────────────
# Adjust table/column names to match YOUR iHRMS schema version

class EmployeeMaster(Base):
    __tablename__ = "emp_master"      # confirm table name with DBA
    emp_id       = Column(String, primary_key=True)
    emp_name     = Column(String)
    designation  = Column(String)
    department   = Column(String)
    grade_pay    = Column(Numeric)
    pay_level    = Column(String)
    status       = Column(String)      # Active / On Deputation / Retired
    doj          = Column(Date)        # Date of joining
    section      = Column(String)

class LeaveApplication(Base):
    __tablename__ = "leave_applications"
    leave_id     = Column(Integer, primary_key=True)
    emp_id       = Column(String)
    leave_type   = Column(String)      # CL / EL / ML / LTC
    from_date    = Column(Date)
    to_date      = Column(Date)
    days         = Column(Integer)
    status       = Column(String)      # Pending / Approved / Rejected
    applied_on   = Column(Date)
    remarks      = Column(Text)

class LeaveBalance(Base):
    __tablename__ = "leave_balance"
    emp_id       = Column(String, primary_key=True)
    leave_type   = Column(String)
    balance_days = Column(Numeric)
    year         = Column(Integer)

class TourRequest(Base):
    __tablename__ = "tour_requests"
    tour_id      = Column(Integer, primary_key=True)
    emp_id       = Column(String)
    destination  = Column(String)
    from_date    = Column(Date)
    to_date      = Column(Date)
    purpose      = Column(String)
    status       = Column(String)
    estimated_ta = Column(Numeric)
    estimated_da = Column(Numeric)
    sanction_no  = Column(String)

class PayrollRecord(Base):
    __tablename__ = "payroll_monthly"
    payroll_id   = Column(Integer, primary_key=True)
    emp_id       = Column(String)
    month        = Column(Integer)
    year         = Column(Integer)
    basic_pay    = Column(Numeric)
    grade_pay    = Column(Numeric)
    da           = Column(Numeric)
    net_pay      = Column(Numeric)

class RTIApplication(Base):
    __tablename__ = "rti_applications"
    rti_id       = Column(String, primary_key=True)
    applicant    = Column(String)
    subject      = Column(Text)
    received_on  = Column(Date)
    due_date     = Column(Date)
    status       = Column(String)
    assigned_to  = Column(String)
    section      = Column(String)

# ── Database access helpers ───────────────────────────────────────
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def fetch_all(model, filters=None, limit=50):
    """Generic read-only fetch helper."""
    async with AsyncSessionLocal() as session:
        q = select(model)
        if filters:
            for f in filters:
                q = q.where(f)
        q = q.limit(limit)
        result = await session.execute(q)
        return result.scalars().all()