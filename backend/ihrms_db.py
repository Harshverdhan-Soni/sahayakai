# backend/ihrms_db.py
# ─────────────────────────────────────────────────────────────────
# iHRMS Database Models — built from actual hrmis_megh backup
# Schema: hrms  |  DB: hrmis  |  Port: 5434 (Docker)
# ─────────────────────────────────────────────────────────────────
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import (
    Column, String, Integer, Float, Double, Boolean,
    DateTime, Text, select, UniqueConstraint, text, Numeric
)
from config import settings
import logging

logger = logging.getLogger(__name__)
SCHEMA = settings.IHRMS_SCHEMA  # "hrms"

# ── Engine ────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args={"server_settings": {"search_path": SCHEMA}},
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()


# ══════════════════════════════════════════════════════════════════
#  CORE TABLES
# ══════════════════════════════════════════════════════════════════

class Employee(Base):
    """hrms.employee — Master employee record"""
    __tablename__ = "employee"
    __table_args__ = {"schema": SCHEMA}

    id                  = Column(Integer,      primary_key=True)
    emp_id              = Column(String(50),   nullable=False, unique=True)
    first_name          = Column(String(255))
    middle_name         = Column(String(255))
    last_name           = Column(String(255))
    title               = Column(String(255))
    gender              = Column(String(255))
    birth_date          = Column(DateTime)
    joining_date        = Column(DateTime)
    joining_date_dept   = Column(DateTime)
    left_date           = Column(DateTime)
    email_id            = Column(String(255))
    contact_no          = Column(String(255))
    emergency_contact_no= Column(String)
    aadhar_no           = Column(String(255))
    pan_no              = Column(String(255))
    bacic_pay           = Column(Double)        # note: typo in real schema
    bank_ifsc_code      = Column(String(255))
    bank_act_no         = Column(String(255))
    marital_status      = Column(String(255))
    blood_group         = Column(Integer)
    religion            = Column(Integer)
    community           = Column(String)
    category            = Column(Integer)
    identification_mark = Column(String)
    profile_photo       = Column(String(255))
    signature           = Column(String(250))
    grade_pay_id        = Column(Integer)
    pay_band_id         = Column(Integer)
    emp_type_id         = Column(Integer)
    emp_level           = Column(Integer)
    designation         = Column(Integer)       # FK → designation.desig_id
    store_id            = Column(Integer)       # FK → store.store_id (posting location)
    prev_store_id       = Column(Integer)
    role_id             = Column(Integer)
    status              = Column(Integer,  default=1)  # 1=Active
    is_hra              = Column(Boolean)
    is_passionaire      = Column(Boolean,  default=True)
    approval_status     = Column(Integer)
    pfms_code           = Column(String)
    fmr_code            = Column(String)
    fmr_id              = Column(Integer)
    programme_id        = Column(Integer)
    speciality_id       = Column(Integer)
    hierarchy_level     = Column(Integer,  default=1)

    def full_name(self):
        parts = [self.title, self.first_name, self.middle_name, self.last_name]
        return " ".join(p for p in parts if p)

    def to_dict(self):
        return {
            "emp_id":       self.emp_id,
            "name":         self.full_name(),
            "email":        self.email_id,
            "contact":      self.contact_no,
            "joining_date": str(self.joining_date)[:10] if self.joining_date else None,
            "grade_pay_id": self.grade_pay_id,
            "designation":  self.designation,
            "store_id":     self.store_id,
            "status":       self.status,
        }


class Designation(Base):
    """hrms.designation — Job designations"""
    __tablename__ = "designation"
    __table_args__ = {"schema": SCHEMA}

    desig_id        = Column(Integer,      primary_key=True)
    desig_name      = Column(String(200))
    grade           = Column(String(2))
    institute_type  = Column(Integer)
    fmr_code        = Column(String)

    def to_dict(self):
        return {"desig_id": self.desig_id, "desig_name": self.desig_name, "grade": self.grade}


class Dept(Base):
    """hrms.dept — Departments"""
    __tablename__ = "dept"
    __table_args__ = {"schema": SCHEMA}

    dept_id   = Column(Integer,      primary_key=True)
    dept_name = Column(String(200))

    def to_dict(self):
        return {"dept_id": self.dept_id, "dept_name": self.dept_name}


class GradePay(Base):
    """hrms.grade_pay — Grade pay master"""
    __tablename__ = "grade_pay"
    __table_args__ = {"schema": SCHEMA}

    grade_pay_id  = Column(Integer,  primary_key=True)
    grade_pay     = Column(Float)
    grade_name    = Column(String)
    starting_pay  = Column(Float)

    def to_dict(self):
        return {
            "grade_pay_id": self.grade_pay_id,
            "grade_pay":    self.grade_pay,
            "grade_name":   self.grade_name,
            "starting_pay": self.starting_pay,
        }


class PayBand(Base):
    """hrms.pay_band"""
    __tablename__ = "pay_band"
    __table_args__ = {"schema": SCHEMA}

    pay_band_id = Column(Integer, primary_key=True)
    pay_band    = Column(String)


class Store(Base):
    """hrms.store — Work location / posting unit"""
    __tablename__ = "store"
    __table_args__ = {"schema": SCHEMA}

    store_id     = Column(Integer,      primary_key=True)
    store_name   = Column(String(200))
    address      = Column(String(200))
    contact_no   = Column(String(10))
    status       = Column(Integer,  default=0)
    state_id     = Column(Integer)
    district     = Column(Integer)
    storetype_id = Column(Integer)
    latitude     = Column(Numeric(10, 6))
    longitude    = Column(Numeric(10, 6))

    def to_dict(self):
        return {"store_id": self.store_id, "store_name": self.store_name, "address": self.address}


class EmpLevel(Base):
    """hrms.emp_level — Employee levels"""
    __tablename__ = "emp_level"
    __table_args__ = {"schema": SCHEMA}

    levels_id   = Column(Integer,  primary_key=True)
    levels_name = Column(String(20))
    gp_range    = Column(String(20))


# ══════════════════════════════════════════════════════════════════
#  LEAVE TABLES
# ══════════════════════════════════════════════════════════════════

class LeaveType(Base):
    """hrms.leave_type — Leave type master (CL, EL, ML etc.)"""
    __tablename__ = "leave_type"
    __table_args__ = {"schema": SCHEMA}

    leave_type_id   = Column(Integer,  primary_key=True)
    leave_type      = Column(String)
    leave_type_code = Column(String)
    no_of_days      = Column(Integer)
    emp_type_id     = Column(Integer)

    def to_dict(self):
        return {
            "leave_type_id":   self.leave_type_id,
            "leave_type":      self.leave_type,
            "leave_type_code": self.leave_type_code,
            "no_of_days":      self.no_of_days,
        }


class LeaveEntry(Base):
    """hrms.leave_entry — Leave applications"""
    __tablename__ = "leave_entry"
    __table_args__ = {"schema": SCHEMA}

    leave_id           = Column(Integer,     primary_key=True)
    emp_id             = Column(String(50))
    leave_type_id      = Column(Integer)     # FK → leave_type.leave_type_id
    leave_from_date    = Column(DateTime)
    leave_to_date      = Column(DateTime)
    leave_app_date     = Column(DateTime)
    leave_approve_date = Column(DateTime)
    no_of_days         = Column(Double)
    leave_day_type     = Column(String(2))   # FN=Forenoon, AN=Afternoon
    leave_reason       = Column(String(200))
    contact_address    = Column(String(250))
    contact_no         = Column(String(10))
    status             = Column(Integer)     # 1=Pending, 2=Approved, 3=Rejected
    approved_by        = Column(String)
    forwarding_emp_id  = Column(String)
    remarks            = Column(String)
    supporting_file    = Column(String)
    is_ltc             = Column(Boolean,     default=False)
    leave_tracking     = Column(Text)

    def to_dict(self):
        return {
            "leave_id":        self.leave_id,
            "emp_id":          self.emp_id,
            "leave_type_id":   self.leave_type_id,
            "from_date":       str(self.leave_from_date)[:10] if self.leave_from_date else None,
            "to_date":         str(self.leave_to_date)[:10]   if self.leave_to_date   else None,
            "no_of_days":      self.no_of_days,
            "status":          self.status,
            "leave_reason":    self.leave_reason,
            "approved_by":     self.approved_by,
            "remarks":         self.remarks,
        }


class LeaveBalance(Base):
    """hrms.leave_balance — Current leave balance per employee"""
    __tablename__ = "leave_balance"
    __table_args__ = {"schema": SCHEMA}

    leave_balance_id = Column(Integer,    primary_key=True)
    emp_id           = Column(String(50))
    leave_type_id    = Column(Integer)    # FK → leave_type.leave_type_id
    leave_balance    = Column(Float)      # total credited
    leave_available  = Column(Float)      # remaining
    leave_pending    = Column(Float)      # applied but not yet approved

    def to_dict(self):
        return {
            "leave_balance_id": self.leave_balance_id,
            "emp_id":           self.emp_id,
            "leave_type_id":    self.leave_type_id,
            "leave_balance":    self.leave_balance,
            "leave_available":  self.leave_available,
            "leave_pending":    self.leave_pending,
        }


class LeaveCreditHistory(Base):
    """hrms.leave_credit_history"""
    __tablename__ = "leave_credit_history"
    __table_args__ = {"schema": SCHEMA}
    # Minimal — extend after inspecting
    id = Column(Integer, primary_key=True)


# ══════════════════════════════════════════════════════════════════
#  SALARY / PAYROLL TABLES
# ══════════════════════════════════════════════════════════════════

class EmpSalary(Base):
    """hrms.emp_salary — Monthly salary records"""
    __tablename__ = "emp_salary"
    __table_args__ = {"schema": SCHEMA}

    salary_id       = Column(Integer,  primary_key=True)
    emp_id          = Column(String(50))
    store_id        = Column(Integer)
    for_month       = Column(DateTime)   # salary month
    created_date    = Column(DateTime)
    entry_date      = Column(DateTime)
    basic           = Column(Double)
    grade_pay       = Column(Float)
    hra             = Column(Float)
    ta              = Column(Float)
    dra             = Column(Float)     # Dearness Relief Allowance
    sca             = Column(Float)     # Special Compensatory Allowance
    npa             = Column(Float,    default=0)   # Non Practising Allowance
    pbh             = Column(Float)
    wa              = Column(Integer)
    ca              = Column(Integer)
    arrear          = Column(Float)
    gross_salary    = Column(Float)
    total_deduction = Column(Float)
    net_pay         = Column(Float)
    recovery        = Column(Float)
    deduction_id    = Column(Integer)
    insurance_fund  = Column(Integer)
    saving_fund     = Column(Integer)
    status          = Column(Integer,  default=1)
    remarks         = Column(String)
    salary_tracking = Column(Text)

    def to_dict(self):
        return {
            "salary_id":    self.salary_id,
            "emp_id":       self.emp_id,
            "for_month":    str(self.for_month)[:7] if self.for_month else None,
            "basic":        self.basic,
            "grade_pay":    self.grade_pay,
            "hra":          self.hra,
            "ta":           self.ta,
            "gross_salary": self.gross_salary,
            "net_pay":      self.net_pay,
            "status":       self.status,
        }


class EmpDeduction(Base):
    """hrms.emp_deduction — Salary deductions per employee"""
    __tablename__ = "emp_deduction"
    __table_args__ = {"schema": SCHEMA}

    deduction_id      = Column(Integer,    primary_key=True)
    emp_id            = Column(String(50))
    epf               = Column(Float)
    direct_tax        = Column(Float)
    prof_tax          = Column(Float)
    leave_without_pay = Column(Float)

    def to_dict(self):
        return {
            "emp_id":            self.emp_id,
            "epf":               self.epf,
            "direct_tax":        self.direct_tax,
            "prof_tax":          self.prof_tax,
            "leave_without_pay": self.leave_without_pay,
        }


class EmpPromotion(Base):
    """hrms.emp_promotion — Promotion history"""
    __tablename__ = "emp_promotion"
    __table_args__ = {"schema": SCHEMA}

    emp_promotion_id = Column(Integer,  primary_key=True)
    emp_id           = Column(String(50))
    promotion_date   = Column(DateTime)
    effective_date   = Column(DateTime)
    basic            = Column(Float)
    level            = Column(Integer)
    employee_type    = Column(Integer)
    promotion_type   = Column(Integer)

    def to_dict(self):
        return {
            "emp_id":         self.emp_id,
            "promotion_date": str(self.promotion_date)[:10] if self.promotion_date else None,
            "effective_date": str(self.effective_date)[:10] if self.effective_date else None,
            "basic":          self.basic,
            "level":          self.level,
        }


# ══════════════════════════════════════════════════════════════════
#  ATTENDANCE / POSTING / WORK TABLES
# ══════════════════════════════════════════════════════════════════

class EmpAttendance(Base):
    """hrms.emp_attendance"""
    __tablename__ = "emp_attendance"
    __table_args__ = {"schema": SCHEMA}

    id                = Column(Integer,    primary_key=True)
    emp_id            = Column(String(50))
    day               = Column(DateTime)
    intime            = Column(String)    # time stored as string
    outtime           = Column(String)
    to_date           = Column(DateTime)
    status            = Column(Integer,   default=0)
    type              = Column(Integer)
    reason            = Column(Integer)
    reason_exp        = Column(String(200))
    apply_date        = Column(DateTime)
    approval_date     = Column(DateTime)
    approved_by       = Column(String)
    forwarding_emp_id = Column(String)
    order_no          = Column(String)
    supporting_file   = Column(String)
    location          = Column(String(50))
    latlong           = Column(String(50))
    latlongout        = Column(String(50))

    def to_dict(self):
        return {
            "emp_id":  self.emp_id,
            "day":     str(self.day)[:10] if self.day else None,
            "intime":  str(self.intime),
            "outtime": str(self.outtime),
            "status":  self.status,
        }


class EmployeePostingHistory(Base):
    """hrms.employee_posting_history — Transfer/posting records"""
    __tablename__ = "employee_posting_history"
    __table_args__ = {"schema": SCHEMA}

    posting_id             = Column(Integer,    primary_key=True)
    emp_id                 = Column(String(50))
    desig_id               = Column(Integer)
    transfer_store_id      = Column(Integer)
    request_store_id       = Column(Integer)
    joining_date           = Column(DateTime)
    request_date           = Column(DateTime)
    approved_date          = Column(DateTime)
    transfer_order_date    = Column(DateTime)
    approved_by            = Column(String)
    forwarding_emp_id      = Column(String)
    status                 = Column(Integer)
    posting_type           = Column(Integer,    default=1)
    request_type           = Column(Integer)
    reason_transfer_request= Column(String)
    remarks                = Column(String)
    supporting_file        = Column(String)
    joining_file           = Column(String)
    transfer_tracking      = Column(Text)
    signature_history      = Column(Text)

    def to_dict(self):
        return {
            "posting_id":    self.posting_id,
            "emp_id":        self.emp_id,
            "joining_date":  str(self.joining_date)[:10] if self.joining_date else None,
            "store_id":      self.transfer_store_id,
            "status":        self.status,
        }


# ══════════════════════════════════════════════════════════════════
#  GRIEVANCE / NOTIFICATIONS / LETTERS
# ══════════════════════════════════════════════════════════════════

class Grievance(Base):
    """hrms.grievance — Employee grievances"""
    __tablename__ = "grievance"
    __table_args__ = {"schema": SCHEMA}

    complaint_id       = Column(Integer,      primary_key=True)
    full_name          = Column(String(255))
    email              = Column(String(100))
    phone              = Column(String(10))
    complaint_summary  = Column(String(250))
    complaint_details  = Column(String(2000))
    complaint_solution = Column(String(2000))
    status             = Column(Integer)      # lookup: 1=Open, 2=InProgress, 3=Resolved

    def to_dict(self):
        status_map = {1: "Open", 2: "In Progress", 3: "Resolved"}
        return {
            "complaint_id":      self.complaint_id,
            "full_name":         self.full_name,
            "email":             self.email,
            "complaint_summary": self.complaint_summary,
            "status":            status_map.get(self.status, str(self.status)),
        }


class Notification(Base):
    """hrms.notifications — System notifications"""
    __tablename__ = "notifications"
    __table_args__ = {"schema": SCHEMA}

    notification_id = Column(Integer,    primary_key=True)
    title           = Column(String(50))
    message         = Column(String(200))
    filename        = Column(String(50))
    status          = Column(Integer,    default=1)
    toemployee      = Column(String(30))
    from_employee   = Column(String)

    def to_dict(self):
        return {
            "notification_id": self.notification_id,
            "title":           self.title,
            "message":         self.message,
            "to_employee":     self.toemployee,
            "from_employee":   self.from_employee,
            "status":          self.status,
        }


class Letters(Base):
    """hrms.letters — Official letters / circulars"""
    __tablename__ = "letters"
    __table_args__ = {"schema": SCHEMA}

    letter_id         = Column(Integer,      primary_key=True)
    letter_no         = Column(String(200))
    letter_date       = Column(DateTime)
    sent_from         = Column(String(200))
    sent_to           = Column(String(200))
    subject           = Column(String(200))
    file_name         = Column(String(250))
    document_type_id  = Column(Integer)
    institute_type_id = Column(Integer)
    user_store_id     = Column(Integer)
    storetype_id      = Column(Integer)
    visibility        = Column(Numeric(1, 0))
    pmu               = Column(String(10))

    def to_dict(self):
        return {
            "letter_id":   self.letter_id,
            "letter_no":   self.letter_no,
            "letter_date": str(self.letter_date)[:10] if self.letter_date else None,
            "subject":     self.subject,
            "sent_from":   self.sent_from,
            "sent_to":     self.sent_to,
        }


class Holiday(Base):
    """hrms.holiday"""
    __tablename__ = "holiday"
    __table_args__ = {"schema": SCHEMA}

    holiday_id    = Column(Integer,    primary_key=True)
    holiday_title = Column(String(50))
    day           = Column(DateTime)
    year          = Column(Integer)

    def to_dict(self):
        return {
            "holiday_id":    self.holiday_id,
            "holiday_title": self.holiday_title,
            "day":           str(self.day)[:10] if self.day else None,
            "year":          self.year,
        }


# ══════════════════════════════════════════════════════════════════
#  WORK REPORT / APPRAISAL
# ══════════════════════════════════════════════════════════════════

class EmpWorkReport(Base):
    """hrms.emp_work_report — Performance appraisal / work reports"""
    __tablename__ = "emp_work_report"
    __table_args__ = {"schema": SCHEMA}

    work_report_id                 = Column(Integer,   primary_key=True)
    emp_id                         = Column(String)
    forwarding_emp_id              = Column(String)
    approved_by                    = Column(String)
    report_from_date               = Column(String(20))
    report_to_date                 = Column(String(20))
    submission_date                = Column(DateTime)
    total_score                    = Column(Float)
    status                         = Column(Integer)
    remarks                        = Column(String)
    appraisee_performance_summary  = Column(String)
    appraisee_strengths            = Column(String)
    appraisee_action_enhancement   = Column(String)
    appraisee_overall_grading      = Column(String)
    appriasee_comments             = Column(String)

    def to_dict(self):
        return {
            "work_report_id":   self.work_report_id,
            "emp_id":           self.emp_id,
            "from_date":        self.report_from_date,
            "to_date":          self.report_to_date,
            "total_score":      self.total_score,
            "overall_grading":  self.appraisee_overall_grading,
            "status":           self.status,
        }


class WorkReportDtl(Base):
    """hrms.work_report_dtl — Task details within work report"""
    __tablename__ = "work_report_dtl"
    __table_args__ = {"schema": SCHEMA}

    id               = Column(Integer,      primary_key=True)
    report_id        = Column(Integer)      # FK → emp_work_report.work_report_id
    task_assigned    = Column(String(1000))
    task_description = Column(String(1000))
    task_status      = Column(Integer)
    task_score       = Column(Float)
    reporting_score  = Column(Float)
    remarks          = Column(String(200))


# ══════════════════════════════════════════════════════════════════
#  ALLOWANCE MASTERS
# ══════════════════════════════════════════════════════════════════

class AllowanceDA(Base):
    """hrms.allowance_da — Dearness Allowance rates"""
    __tablename__ = "allowance_da"
    __table_args__ = {"schema": SCHEMA}

    allowance_da_id  = Column(Integer,  primary_key=True)
    da_allowance     = Column(Float)
    emp_type_id      = Column(Integer)
    institute_type_id= Column(Integer)
    from_date        = Column(DateTime)
    to_date          = Column(DateTime)


class AllowanceHRA(Base):
    """hrms.allowance_hra — HRA rates by city category"""
    __tablename__ = "allowance_hra"
    __table_args__ = {"schema": SCHEMA}

    allowance_hra_id  = Column(Integer,  primary_key=True)
    hra_allowance     = Column(Float)
    city_category_id  = Column(Integer)
    emp_type_id       = Column(Integer)
    institute_type_id = Column(Integer)


class AllowanceTA(Base):
    """hrms.allowance_ta — Transport Allowance rates"""
    __tablename__ = "allowance_ta"
    __table_args__ = {"schema": SCHEMA}

    allowance_ta_id = Column(Integer,  primary_key=True)
    allowance_ta    = Column(Float)
    lavel_id        = Column(Integer)
    category_id     = Column(Integer)
    emp_type_id     = Column(Integer)
    grade_pay_id    = Column(Integer)


# ══════════════════════════════════════════════════════════════════
#  EMPLOYEE PROFILE TABLES
# ══════════════════════════════════════════════════════════════════

class EmployeeQualification(Base):
    """hrms.employee_qualification"""
    __tablename__ = "employee_qualification"
    __table_args__ = {"schema": SCHEMA}

    id               = Column(Integer,     primary_key=True)
    emp_id           = Column(String(50))
    qualifiaction    = Column(String(200))  # note: typo in real schema
    institute        = Column(String(200))
    university       = Column(String)
    course_duration  = Column(String)
    registration_no  = Column(String)
    pass_date        = Column(DateTime)
    file             = Column(String(200))
    status           = Column(Integer,     default=0)


class EmployeeTraining(Base):
    """hrms.employee_training"""
    __tablename__ = "employee_training"
    __table_args__ = {"schema": SCHEMA}

    id             = Column(Integer,     primary_key=True)
    emp_id         = Column(String(50))
    training_name  = Column(String(200))
    training_place = Column(String(200))
    from_date      = Column(DateTime)
    to_date        = Column(DateTime)
    file           = Column(String(200))
    tot            = Column(Boolean)     # Training of Trainers


class Login(Base):
    """hrms.login — User login credentials"""
    __tablename__ = "login"
    __table_args__ = {"schema": SCHEMA}

    # Minimal — don't expose password fields to SAHAYAK
    id     = Column(Integer, primary_key=True)
    emp_id = Column(String(50))
    # password fields intentionally omitted


# ══════════════════════════════════════════════════════════════════
#  DATABASE HELPERS
# ══════════════════════════════════════════════════════════════════

async def get_db():
    """FastAPI dependency — yields an async session."""
    async with AsyncSessionLocal() as session:
        yield session


async def fetch_all(model, filters=None, limit=50):
    """Generic read-only fetch."""
    async with AsyncSessionLocal() as session:
        try:
            q = select(model)
            if filters:
                for f in filters:
                    q = q.where(f)
            result = await session.execute(q.limit(limit))
            return result.scalars().all()
        except Exception as e:
            logger.error(f"fetch_all({model.__tablename__}) failed: {e}")
            return []


async def fetch_one(model, filters):
    """Fetch a single record."""
    async with AsyncSessionLocal() as session:
        try:
            q = select(model)
            for f in filters:
                q = q.where(f)
            result = await session.execute(q.limit(1))
            return result.scalars().first()
        except Exception as e:
            logger.error(f"fetch_one({model.__tablename__}) failed: {e}")
            return None


async def ping_db() -> bool:
    """Health check — call on FastAPI startup."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        print("✓ iHRMS DB connected  hrmis @ localhost:5434  schema=hrms")
        logger.info("✓ iHRMS DB connected")
        return True
    except Exception as e:
        print(f"✗ DB ping failed: {e}")
        logger.error(f"✗ DB ping failed: {e}")
        return False