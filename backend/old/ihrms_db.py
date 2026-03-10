# backend/ihrms_db.py  — updated for Docker PostgreSQL
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import (
    Column, String, Integer, Date, Numeric,
    Text, select, UniqueConstraint, text
)
from config import settings
import logging

logger = logging.getLogger(__name__)

# ── Engine — connects to Docker PostgreSQL on port 5434 ───────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args={
        "server_settings": {
            "search_path": settings.IHRMS_SCHEMA   # use hrms schema by default
        }
    }
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()
SCHEMA = settings.IHRMS_SCHEMA   # "hrms"


class EmployeeMaster(Base):
    __tablename__ = "emp_master"
    __table_args__ = {"schema": SCHEMA}
    emp_id       = Column(String(20),  primary_key=True)
    emp_name     = Column(String(100), nullable=False)
    designation  = Column(String(100))
    department   = Column(String(100))
    section      = Column(String(100))
    grade_pay    = Column(Numeric(10, 2))
    pay_level    = Column(String(10))
    basic_pay    = Column(Numeric(10, 2))
    status       = Column(String(30))
    doj          = Column(Date)
    dob          = Column(Date)
    mobile       = Column(String(15))
    email        = Column(String(100))
    def to_dict(self):
        return {"emp_id":self.emp_id,"emp_name":self.emp_name,"designation":self.designation,
                "department":self.department,"section":self.section,"grade_pay":float(self.grade_pay or 0),
                "pay_level":self.pay_level,"status":self.status,"doj":str(self.doj) if self.doj else None}


class LeaveApplication(Base):
    __tablename__ = "leave_applications"
    __table_args__ = {"schema": SCHEMA}
    leave_id     = Column(Integer,     primary_key=True, autoincrement=True)
    emp_id       = Column(String(20),  nullable=False)
    leave_type   = Column(String(10),  nullable=False)
    from_date    = Column(Date,        nullable=False)
    to_date      = Column(Date,        nullable=False)
    days         = Column(Integer)
    status       = Column(String(20))
    applied_on   = Column(Date)
    approved_by  = Column(String(20))
    remarks      = Column(Text)
    def to_dict(self):
        return {"leave_id":self.leave_id,"emp_id":self.emp_id,"leave_type":self.leave_type,
                "from_date":str(self.from_date),"to_date":str(self.to_date),
                "days":self.days,"status":self.status,"remarks":self.remarks}


class LeaveBalance(Base):
    __tablename__ = "leave_balance"
    __table_args__ = (UniqueConstraint("emp_id","leave_type","year",name="uq_leave_balance"),{"schema":SCHEMA})
    id           = Column(Integer,    primary_key=True, autoincrement=True)
    emp_id       = Column(String(20), nullable=False)
    leave_type   = Column(String(10), nullable=False)
    balance_days = Column(Numeric(6, 1))
    year         = Column(Integer,    nullable=False)
    def to_dict(self):
        return {"emp_id":self.emp_id,"leave_type":self.leave_type,
                "balance_days":float(self.balance_days or 0),"year":self.year}


class TourRequest(Base):
    __tablename__ = "tour_requests"
    __table_args__ = {"schema": SCHEMA}
    tour_id      = Column(Integer,     primary_key=True, autoincrement=True)
    emp_id       = Column(String(20),  nullable=False)
    destination  = Column(String(100), nullable=False)
    from_date    = Column(Date,        nullable=False)
    to_date      = Column(Date,        nullable=False)
    purpose      = Column(String(200))
    status       = Column(String(20))
    estimated_ta = Column(Numeric(10, 2))
    estimated_da = Column(Numeric(10, 2))
    actual_ta    = Column(Numeric(10, 2))
    actual_da    = Column(Numeric(10, 2))
    sanction_no  = Column(String(50))
    advance_paid = Column(Numeric(10, 2))
    def to_dict(self):
        return {"tour_id":self.tour_id,"emp_id":self.emp_id,"destination":self.destination,
                "from_date":str(self.from_date),"to_date":str(self.to_date),
                "purpose":self.purpose,"status":self.status,
                "estimated_ta":float(self.estimated_ta or 0),"sanction_no":self.sanction_no}


class PayrollRecord(Base):
    __tablename__ = "payroll_monthly"
    __table_args__ = (UniqueConstraint("emp_id","month","year",name="uq_payroll_month"),{"schema":SCHEMA})
    payroll_id   = Column(Integer,    primary_key=True, autoincrement=True)
    emp_id       = Column(String(20), nullable=False)
    month        = Column(Integer,    nullable=False)
    year         = Column(Integer,    nullable=False)
    basic_pay    = Column(Numeric(10, 2))
    grade_pay    = Column(Numeric(10, 2))
    da           = Column(Numeric(10, 2))
    hra          = Column(Numeric(10, 2))
    ta           = Column(Numeric(10, 2))
    gross_pay    = Column(Numeric(10, 2))
    deductions   = Column(Numeric(10, 2))
    net_pay      = Column(Numeric(10, 2))
    def to_dict(self):
        return {"emp_id":self.emp_id,"month":self.month,"year":self.year,
                "basic_pay":float(self.basic_pay or 0),"grade_pay":float(self.grade_pay or 0),
                "net_pay":float(self.net_pay or 0)}


class RTIApplication(Base):
    __tablename__ = "rti_applications"
    __table_args__ = {"schema": SCHEMA}
    rti_id       = Column(String(30),  primary_key=True)
    applicant    = Column(String(100))
    subject      = Column(Text)
    received_on  = Column(Date)
    due_date     = Column(Date)
    status       = Column(String(20))
    assigned_to  = Column(String(20))
    section      = Column(String(100))
    first_appeal = Column(String(30))
    def to_dict(self):
        from datetime import date as dt
        days_left = (self.due_date - dt.today()).days if self.due_date else None
        return {"rti_id":self.rti_id,"applicant":self.applicant,"subject":self.subject,
                "received_on":str(self.received_on) if self.received_on else None,
                "due_date":str(self.due_date) if self.due_date else None,
                "days_left":days_left,"status":self.status,"assigned_to":self.assigned_to}


# ── Helpers ───────────────────────────────────────────────────────
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def fetch_all(model, filters=None, limit=50):
    async with AsyncSessionLocal() as session:
        try:
            q = select(model)
            if filters:
                for f in filters: q = q.where(f)
            result = await session.execute(q.limit(limit))
            return result.scalars().all()
        except Exception as e:
            logger.error(f"fetch_all({model.__tablename__}) failed: {e}")
            return []

async def fetch_one(model, filters):
    async with AsyncSessionLocal() as session:
        try:
            q = select(model)
            for f in filters: q = q.where(f)
            result = await session.execute(q.limit(1))
            return result.scalars().first()
        except Exception as e:
            logger.error(f"fetch_one({model.__tablename__}) failed: {e}")
            return None

async def ping_db() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        logger.info("✓ iHRMS DB connected  hrmis @ localhost:5434  schema=hrms")
        return True
    except Exception as e:
        logger.error(f"✗ DB ping failed: {e}")
        return False
