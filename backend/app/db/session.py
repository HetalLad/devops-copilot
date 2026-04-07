from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

# ✅ Always create DB in backend/ (absolute path)
DB_FILE = Path(__file__).resolve().parents[2] / "devops_copilot.db"
DB_URL = fos.environ.get("DATABASE_URL", "sqlite:///./devops.db")

engine = create_engine(DB_URL, echo=False)

def init_db():
    # ✅ Force-import models so tables register into SQLModel.metadata
    from app.db.models import User, Message  # noqa: F401

    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
