from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session

from app.services.llm_client import stream_llm_response
from app.db.session import engine
from app.db.models import Message
from app.core.security import get_current_user

router = APIRouter()

SYSTEM_PROMPT = """You are an expert DevOps engineer analyzing a production incident. Be specific and technical.

Respond in exactly 4 labeled sections. Use the exact labels shown below.

ROOT CAUSE:
[One paragraph explaining the specific root cause. Reference exact values, ports, limits, or service names from the logs.]

DIAGNOSTIC CHECKS:
1. [Specific shell command or check]
2. [Specific shell command or check]
3. [Specific shell command or check]

SAFE REMEDIATION STEPS:
1. [Specific ordered action]
2. [Specific ordered action]
3. [Specific ordered action]
Mark any destructive action with [CAUTION].

PREVENTION:
[One or two sentences on monitoring/alerting/config to prevent recurrence.]

Do not repeat sections. Do not add extra commentary outside these sections."""


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user)):
    with Session(engine) as session:
        session.add(Message(user_id=user_id, role="user", content=req.message))
        session.commit()

    full_prompt = f"""<s>
{SYSTEM_PROMPT}

Logs / error to analyze:
{req.message}

ROOT CAUSE:"""

    async def generator():
        assistant_text = ""
        try:
            async for chunk in stream_llm_response(full_prompt):
                assistant_text += chunk
                yield chunk
        except Exception as e:
            yield f"\n\n[LLM_ERROR] {type(e).__name__}: {e}\n"
            return

        with Session(engine) as session:
            session.add(Message(user_id=user_id, role="assistant", content=assistant_text))
            session.commit()

    return StreamingResponse(generator(), media_type="text/plain")
