# backend/mcp_server.py
import json, time
from dataclasses import dataclass, field
from typing import Callable, Any
from audit import audit_log
from llm_client import llm

# ── Tool definition ──────────────────────────────────────────────
@dataclass
class MCPTool:
    name:        str
    description: str
    parameters:  dict            # JSON Schema
    handler:     Callable        # async function
    read_only:   bool = True    # write tools need extra HITL gate
    requires_approval: bool = False

# ── MCP Host ─────────────────────────────────────────────────────
class MCPServer:
    def __init__(self):
        self._tools: dict[str, MCPTool] = {}
        self._policy = {
            "max_tokens_per_call": 4096,
            "allowed_write_tools": [],   # locked in pilot
            "require_hitl_for": ["draft_reply", "generate_mis"],
        }

    def register(self, tool: MCPTool):
        self._tools[tool.name] = tool
        print(f"[MCP] Registered tool: {tool.name}")

    async def call_tool(
        self, tool_name: str, args: dict, officer_id: str
    ) -> dict:
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        tool = self._tools[tool_name]

        # Policy gate: no write tools in pilot
        if not tool.read_only and tool_name not in self._policy["allowed_write_tools"]:
            raise PermissionError(f"Write tool '{tool_name}' blocked by MCP policy")

        start = time.time()
        result = await tool.handler(**args)
        elapsed = round((time.time() - start) * 1000)

        # Audit every tool call
        await audit_log(
            officer_id=officer_id,
            action=f"tool_call:{tool_name}",
            details={"args": args, "elapsed_ms": elapsed},
            ai_generated=True
        )
        return {"tool": tool_name, "result": result, "ms": elapsed}

    async def run_agent(
        self,
        prompt: str,
        officer_id: str,
        conversation_history: list = None
    ) -> dict:
        """
        Core agent loop:
        1. Classify intent → choose tools
        2. Call tools to fetch iHRMS context
        3. Build enriched prompt → call LLM
        4. Return response + tool traces + HITL flag
        """
        tool_calls = []
        context_parts = []

        # Step 1: Classify intent
        intent = _classify_intent(prompt)

        # Step 2: Fetch relevant iHRMS data
        for tool_name in intent["tools"]:
            try:
                result = await self.call_tool(
                    tool_name,
                    args=intent.get("tool_args", {}).get(tool_name, {}),
                    officer_id=officer_id
                )
                tool_calls.append(result)
                context_parts.append(f"[{tool_name}]: {json.dumps(result['result'])}")
            except Exception as e:
                tool_calls.append({"tool": tool_name, "error": str(e)})

        # Step 3: Call LLM with enriched context
        context = "\n".join(context_parts)
        response = await llm.chat(prompt, context=context, history=conversation_history)

        # Step 4: Detect if HITL needed
        needs_hitl = _needs_hitl(response, intent)

        return {
            "response": response,
            "tool_calls": tool_calls,
            "agent_chain": intent["agents"],
            "needs_hitl": needs_hitl,
        }

    def list_tools(self):
        return [
            {"name": t.name, "description": t.description, "read_only": t.read_only}
            for t in self._tools.values()
        ]

# ── Intent classifier ────────────────────────────────────────────
def _classify_intent(prompt: str) -> dict:
    p = prompt.lower()
    if any(w in p for w in ["leave", "cl ", "earned leave"]):
        return {"tools": ["get_leave_applications", "check_leave_balance"],
                "agents": ["coordinator", "leave"]}
    if any(w in p for w in ["rti", "right to information"]):
        return {"tools": ["get_rti_applications", "check_rti_deadlines"],
                "agents": ["coordinator", "rti"]}
    if any(w in p for w in ["tour", "ta/da", "travel"]):
        return {"tools": ["get_tour_requests", "calculate_tada"],
                "agents": ["coordinator", "tour"]}
    if any(w in p for w in ["employee", "ihrms", "payroll", "service book"]):
        return {"tools": ["get_employee_master", "validate_payroll"],
                "agents": ["coordinator", "hrdata"]}
    if any(w in p for w in ["mis", "report", "pendency"]):
        return {"tools": ["get_pendency_report"],
                "agents": ["coordinator", "mis"]}
    return {"tools": [], "agents": ["coordinator"]}

def _needs_hitl(response: str, intent: dict) -> bool:
    action_words = ["draft", "recommend", "approve", "circulate", "send"]
    return any(w in response.lower() for w in action_words)

mcp = MCPServer()