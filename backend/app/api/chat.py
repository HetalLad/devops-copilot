from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.llm_client import stream_llm_response

router = APIRouter()

SYSTEM_PROMPT = """
You are an AI DevOps Support Copilot.
Your job is to analyze logs and errors, identify root causes,
and suggest safe, step-by-step remediation.
Avoid destructive commands unless explicitly confirmed.
"""

@router.post("/chat")
async def chat(request: dict):
    user_input = request.get("message", "")

    full_prompt = f"""
{SYSTEM_PROMPT}

User logs / error:
{user_input}

Respond with:
- Probable root cause
- Recommended checks
- Safe remediation steps
"""

    return StreamingResponse(
        stream_llm_response(full_prompt),
        media_type="text/plain"
    )
