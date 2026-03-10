# backend/agents/llm.py
# Ollama LLM wrapper — called by all agents

import httpx
import json
import logging
from config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are SAHAYAK-AI, a decision-support assistant for Indian government Section Officers.

CRITICAL RULES:
1. Every response must end with: [OFFICER APPROVAL REQUIRED BEFORE ANY ACTION]
2. You only RECOMMEND — never claim to have executed any action.
3. Always cite relevant Acts/Rules: RTI Act 2005, CCS (Leave) Rules 1972, SR Rules for TA/DA.
4. Use formal government language. Address officer as Sir/Ma'am.
5. Use **bold** for critical items. Flag SLA breaches and policy violations clearly.
6. When real iHRMS data is provided, base your answer on that data — do not fabricate.
7. Keep responses under 400 words unless drafting a full document."""

async def call_ollama(user_message: str, history: list) -> str:
    """Call local Ollama llama3.2 and return complete response."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add last 6 messages for context window
    for h in history[-6:]:
        messages.append({
            "role":    "user" if h["role"] == "user" else "assistant",
            "content": h["text"],
        })
    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model":   settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream":  False,          # non-streaming for backend
                    "options": {
                        "temperature":    0.2,
                        "num_predict":    600,
                        "top_p":          0.9,
                        "repeat_penalty": 1.1,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    except httpx.TimeoutException:
        return "⚠ Ollama timed out. The model may be loading — please retry in a moment."
    except Exception as e:
        logger.error(f"Ollama error: {e}")
        return f"⚠ Could not reach Ollama: {e}\n\nEnsure `ollama serve` is running."
