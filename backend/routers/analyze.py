import time
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.schemas import AnalyzeRequest, ConsensusResult
from pipeline.sanitizer import sanitize_input
from pipeline.verifier import run_verifiers
from pipeline.consensus import compute_consensus
from db.database import get_db
from db import crud

router = APIRouter()


@router.post("/analyze", response_model=ConsensusResult)
async def analyze_input(request: AnalyzeRequest, db: Session = Depends(get_db)):
    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    if len(request.input) > 10000:
        raise HTTPException(status_code=400, detail="Input too long. Maximum 10,000 characters.")

    start_time = time.time()
    mode = request.mode if request.mode in ("fast", "strict") else "strict"
    fast_mode = mode == "fast"

    original_input = request.input.strip()
    sanitized_text = original_input
    was_sanitized = False

    try:
        # Stage 1: Sanitizer (strict mode only)
        if not fast_mode:
            san_result = sanitize_input(original_input)
            if san_result.get("error"):
                # Sanitizer failed — proceed without sanitization but mark it
                was_sanitized = False
                sanitized_text = original_input
            else:
                sanitized_text = san_result.get("sanitized_text", original_input)
                was_sanitized = san_result.get("was_modified", False)

        # Stage 2: Verifiers
        text_to_verify = sanitized_text if not fast_mode else original_input
        agent_verdicts = run_verifiers(text_to_verify, fast_mode=fast_mode)

        # Stage 3: Consensus
        elapsed_ms = int((time.time() - start_time) * 1000)
        result = compute_consensus(agent_verdicts, was_sanitized, elapsed_ms)
        result["sanitized_text"] = sanitized_text
        result["original_input"] = original_input

        # Persist to DB
        log_data = {
            "original_input": original_input,
            "sanitized_input": sanitized_text if was_sanitized else None,
            "verdict": result["verdict"],
            "injection_score": result["injection_score"],
            "was_sanitized": was_sanitized,
            "processing_time_ms": elapsed_ms,
            "agent1_verdict": json.dumps(agent_verdicts[0]) if len(agent_verdicts) > 0 else None,
            "agent2_verdict": json.dumps(agent_verdicts[1]) if len(agent_verdicts) > 1 else None,
            "agent3_verdict": json.dumps(agent_verdicts[2]) if len(agent_verdicts) > 2 else None,
            "mode": mode,
        }
        crud.create_log(db, log_data)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
