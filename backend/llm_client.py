# backend/llm_client.py
import httpx, json
from typing import AsyncIterator
from config import settings

# System prompt — enforces government-safe, HITL behaviour
SYSTEM_PROMPT = """You are SAHAYAK-AI, a government decision-support assistant.

RULES (never violate):
1. You assist; you NEVER take autonomous decisions.
2. Every recommendation must cite the source document or SOP rule.
3. For RTI matters, always reference the correct section of RTI Act 2005.
4. Never fabricate data — only use information from provided context.
5. Always end actionable responses with: [OFFICER APPROVAL REQUIRED]
6. Respond in clear, formal English suitable for government records.
7. Keep responses concise — officers are busy.

You have access to real iHRMS data provided in context below.
"""

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.model    = settings.OLLAMA_MODEL

    async def chat(
        self,
        user_message: str,
        context: str = "",
        history: list = None
    ) -> str:
        """Single-shot chat with context injection."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context:
            messages.append({
                "role": "system",
                "content": f"LIVE DATA FROM iHRMS:\n{context}"
            })

        if history:
            messages.extend(history[-6:])  # last 3 exchanges

        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,   # Low temp = factual, consistent
                        "num_ctx": 8192       # Context window
                    }
                }
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def stream_chat(
        self, user_message: str, context: str = ""
    ) -> AsyncIterator[str]:
        """Streaming response for real-time chat feel."""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{context}\n\n{user_message}" if context else user_message}
        ]
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST", f"{self.base_url}/api/chat",
                json={"model": self.model, "messages": messages, "stream": True}
            ) as resp:
                async for line in resp.aiter_lines():
                    if line:
                        chunk = json.loads(line)
                        if not chunk.get("done"):
                            yield chunk["message"]["content"]

llm = OllamaClient()