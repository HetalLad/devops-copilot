from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.db.models import Message
from app.core.security import get_current_user

router = APIRouter()


@router.get("/history")
def history(user_id: str = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = (
        select(Message)
        .where(Message.user_id == user_id)
        .order_by(Message.created_at.asc())
    )
    return session.exec(stmt).all()
