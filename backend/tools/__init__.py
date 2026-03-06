# backend/tools/__init__.py
from mcp_server import mcp, MCPTool
from tools.leave_tools import get_leave_applications, check_leave_balance, detect_leave_anomalies
from tools.tour_tools  import get_tour_requests, calculate_tada
from tools.rti_tools   import get_rti_applications, check_rti_deadlines
from tools.file_tools  import get_pending_files, get_pendency_report
from tools.hr_tools    import get_employee_master, validate_payroll

def register_all_tools():
    tools = [
        MCPTool("get_leave_applications",
                "Fetch leave applications from iHRMS",
                {"status": "string"}, get_leave_applications),
        MCPTool("check_leave_balance",
                "Get employee leave balance from iHRMS",
                {"emp_id": "string"}, check_leave_balance),
        MCPTool("detect_leave_anomalies",
                "Detect clustering or anomalous leave patterns",
                {}, detect_leave_anomalies),
        MCPTool("get_tour_requests",
                "Fetch tour requests from iHRMS",
                {"status": "string"}, get_tour_requests),
        MCPTool("calculate_tada",
                "Calculate TA/DA per SR rules",
                {"destination": "string", "days": "int", "grade_pay": "float"},
                calculate_tada),
        MCPTool("get_rti_applications",
                "Fetch RTI applications and deadlines",
                {"status": "string"}, get_rti_applications),
        MCPTool("check_rti_deadlines",
                "Check which RTI replies are approaching deadline",
                {"days_ahead": "int"}, check_rti_deadlines),
        MCPTool("get_pending_files",
                "Get pending files from file management system",
                {"section": "string"}, get_pending_files),
        MCPTool("get_pendency_report",
                "Generate section-wise pendency MIS",
                {}, get_pendency_report),
        MCPTool("get_employee_master",
                "Fetch employee records from iHRMS",
                {"dept": "string"}, get_employee_master),
        MCPTool("validate_payroll",
                "Cross-check payroll against service book",
                {"month": "int", "year": "int"}, validate_payroll),
    ]
    for t in tools:
        mcp.register(t)