# backend/agents/orchestrator.py
# ─────────────────────────────────────────────────────────────────
# SAHAYAK-AI Agent Orchestrator
# NO Langchain/Langgraph — pure Python async orchestration.
# Each agent is a plain async function that:
#   1. Queries iHRMS DB for real data
#   2. Builds a rich context string
#   3. Passes it to Ollama LLM with a system prompt
# ─────────────────────────────────────────────────────────────────

import logging
from agents.leave_agent    import LeaveAgent
from agents.employee_agent import EmployeeAgent
from agents.salary_agent   import SalaryAgent
from agents.grievance_agent import GrievanceAgent
from agents.letter_agent   import LetterAgent
from agents.attendance_agent import AttendanceAgent
from agents.llm            import call_ollama

logger = logging.getLogger(__name__)

# ── Intent classifier — routes message to the right agent ────────
def classify_intent(message: str) -> str:
    m = message.lower()
    if any(k in m for k in ["leave", "cl", "el", "ml", "ltc", "balance", "application"]):
        return "leave"
    if any(k in m for k in ["salary", "payroll", "pay slip", "net pay", "gross", "deduction", "allowance"]):
        return "salary"
    if any(k in m for k in ["grievance", "complaint", "cpgrams"]):
        return "grievance"
    if any(k in m for k in ["letter", "circular", "dak", "correspondence", "order"]):
        return "letter"
    if any(k in m for k in ["attendance", "present", "absent", "intime", "outtime", "biometric"]):
        return "attendance"
    if any(k in m for k in ["employee", "staff", "promotion", "transfer", "posting", "designation"]):
        return "employee"
    return "general"

# Agent chain labels shown in the UI
AGENT_CHAINS = {
    "leave":      ["coordinator", "leave"],
    "salary":     ["coordinator", "hrdata"],
    "grievance":  ["coordinator", "rti"],
    "letter":     ["coordinator", "document"],
    "attendance": ["coordinator", "hrdata"],
    "employee":   ["coordinator", "hrdata"],
    "general":    ["coordinator"],
}

# ── Main entry point called by FastAPI ───────────────────────────
async def run_agent(message: str, history: list, officer_id: str) -> dict:
    intent = classify_intent(message)
    logger.info(f"Intent: {intent} | Message: {message[:60]}")

    # 1. Fetch real DB context based on intent
    db_context = ""
    tool_calls = []

    if intent == "leave":
        db_context, tool_calls = await LeaveAgent.fetch(message)
    elif intent == "salary":
        db_context, tool_calls = await SalaryAgent.fetch(message)
    elif intent == "grievance":
        db_context, tool_calls = await GrievanceAgent.fetch(message)
    elif intent == "letter":
        db_context, tool_calls = await LetterAgent.fetch(message)
    elif intent == "attendance":
        db_context, tool_calls = await AttendanceAgent.fetch(message)
    elif intent == "employee":
        db_context, tool_calls = await EmployeeAgent.fetch(message)

    # 2. Build prompt with DB data injected
    augmented_prompt = build_prompt(message, db_context)

    # 3. Call Ollama LLM
    llm_response = await call_ollama(augmented_prompt, history)

    # 4. Detect if HITL card is needed
    needs_hitl = any(k in llm_response.lower() for k in [
        "recommend", "approve", "draft", "action required", "suggest"
    ])

    return {
        "response":    llm_response,
        "agent_chain": AGENT_CHAINS.get(intent, ["coordinator"]),
        "tool_calls":  tool_calls,
        "db_context":  db_context[:300] if db_context else None,
        "needs_hitl":  needs_hitl,
    }

def build_prompt(user_message: str, db_context: str) -> str:
    if db_context:
        return f"""The following is LIVE DATA fetched from the iHRMS database:

--- iHRMS DATA START ---
{db_context}
--- iHRMS DATA END ---

Based on this real data, please answer the following query from the Section Officer:
{user_message}

Use the actual data above in your response. Do not make up numbers or names."""
    return user_message
