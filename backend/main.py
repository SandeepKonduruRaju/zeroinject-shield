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

# CORS — ALLOWED_ORIGINS accepts a comma-separated list for multi-frontend deploys.
# Example: "https://dashboard.vercel.app,https://ecommerce.vercel.app"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra = [o.strip() for o in _raw_origins.split(",") if o.strip()]

_dev_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_dev_origins + _extra,
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
