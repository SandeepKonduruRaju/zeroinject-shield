import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dataset.loader import is_dataset_loaded
from db.database import create_tables
from routers import analyze, demo, logs, secure_chat, stats

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(title="ZeroInject Shield API", version="1.0.0", lifespan=lifespan)

# CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifespan handles DB tables on startup



# Routers
app.include_router(analyze.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(secure_chat.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "models": {
            "agent1": "llama-3.3-70b-versatile",
            "agent2": "llama-3.1-8b-instant",
            "agent3": "qwen/qwen3-32b"
        },
        "dataset_loaded": is_dataset_loaded(),
    }
