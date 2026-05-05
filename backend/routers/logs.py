from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from db.database import get_db
from db import crud
from models.schemas import LogEntry
import json

router = APIRouter()


@router.get("/logs")
async def get_logs(
    verdict: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    logs = crud.get_logs(db, verdict=verdict, limit=limit)
    result = []
    for log in logs:
        entry = {
            "id": log.id,
            "timestamp": log.timestamp,
            "original_input": log.original_input,
            "sanitized_input": log.sanitized_input,
            "verdict": log.verdict,
            "injection_score": log.injection_score,
            "was_sanitized": log.was_sanitized,
            "processing_time_ms": log.processing_time_ms,
            "mode": log.mode,
            "action_taken": getattr(log, "action_taken", None),
            "chatbot_response": getattr(log, "chatbot_response", None),
            "attack_type": getattr(log, "attack_type", None),
            "created_at": log.created_at,
            "agent1_verdict": _safe_parse(log.agent1_verdict),
            "agent2_verdict": _safe_parse(log.agent2_verdict),
            "agent3_verdict": _safe_parse(log.agent3_verdict),
        }
        result.append(entry)
    return result


def _safe_parse(val):
    if not val:
        return None
    try:
        return json.loads(val)
    except Exception:
        return val
