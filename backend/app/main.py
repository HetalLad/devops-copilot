from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.history import router as history_router
from app.api.auth import router as auth_router
from app.db.session import init_db

app = FastAPI(title="DevOps Copilot API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "devops-copilot-api", "version": "0.2.0"}


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(history_router)
