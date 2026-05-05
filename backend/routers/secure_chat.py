import time
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db import crud
from pipeline.sanitizer import sanitize_input
from pipeline.verifier import run_verifiers
from pipeline.consensus import compute_consensus
from pipeline.policy import decide_action, get_block_response
from pipeline.chatbot import call_chatbot

router = APIRouter()

logger = logging.getLogger(__name__)


def _extract_attack_type(agent_verdicts: list) -> str | None:
    """Extract the most relevant attack/threat type from agent verdicts.
    Picks the highest-confidence agent's threat_type or reason."""
    best_type = None
    best_confidence = 0.0

    for verdict in agent_verdicts:
        if not verdict.get("is_injection", False):
            continue

        confidence = verdict.get("confidence", 0.0)

        # Try threat_type first (from Agent 3), then classification (Agent 2), then reason
        candidate = verdict.get("threat_type")
        if not candidate or candidate == "null" or candidate == "None":
            candidate = verdict.get("classification")
            if candidate in ("legitimate", "uncertain", None):
                candidate = None
        if not candidate:
            reason = verdict.get("reason", "")
            if reason and len(reason) <= 60:
                candidate = reason

        if candidate and confidence >= best_confidence:
            best_type = candidate
            best_confidence = confidence

    return best_type


@router.post("/secure-chat")
async def secure_chat(request: dict, db: Session = Depends(get_db)):
    """
    Middleware endpoint: protects a chatbot from prompt injection.

    Flow:
      1. Sanitize original input
      2. Run verifiers on ORIGINAL input (not sanitized — to avoid hiding attacks)
      3. Compute consensus
      4. Apply policy decision
      5. If SANITIZE → post-verify sanitized text to prevent bypass
      6. If BLOCK → return natural response, never call chatbot
      7. If SANITIZE → call chatbot with sanitized text
      8. If ALLOW → call chatbot with original text
    """
    user_input = request.get("input", "").strip()
    original_input_override = request.get("original_input", "").strip()
    
    if not user_input:
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    if len(user_input) > 10000:
        raise HTTPException(status_code=400, detail="Input too long. Maximum 10,000 characters.")

    start_time = time.time()

    # Priority mapping: trace back the absolute original input natively bypassing React scrubbing
    original_input = original_input_override if original_input_override else user_input
    sanitized_text = user_input
    was_sanitized = False

    high_risk_patterns = [
        "ignore instructions", "act as admin", "override rules",
        "reveal system prompt", "bypass security"
    ]
    is_high_risk = any(p in original_input.lower() for p in high_risk_patterns)
    restricted_msg = "We offer general assistance with products, orders, and promotions. Please check our website for current offers."

    try:
        # Stage 1: Sanitize input
        san_result = sanitize_input(original_input)
        if san_result.get("error"):
            sanitized_text = original_input
            was_sanitized = False
        else:
            sanitized_text = san_result.get("sanitized_text", original_input)
            was_sanitized = san_result.get("was_modified", False)

        if sanitized_text == "[NO_LEGITIMATE_INTENT]":
            elapsed_ms = int((time.time() - start_time) * 1000)
            block_response = restricted_msg if is_high_risk else get_block_response(original_input)

            crud.create_log(db, {
                "original_input": original_input,
                "sanitized_input": sanitized_text,
                "verdict": "BLOCKED",
                "injection_score": 1.0,
                "was_sanitized": was_sanitized,
                "processing_time_ms": elapsed_ms,
                "agent1_verdict": None,
                "agent2_verdict": None,
                "agent3_verdict": None,
                "mode": "middleware",
                "action_taken": "BLOCK",
                "chatbot_response": block_response,
                "attack_type": "no_legitimate_intent",
            })
            return {
                "response": block_response,
                "verdict": "BLOCKED",
                "injection_score": 1.0,
                "action_taken": "BLOCK",
                "processing_time_ms": elapsed_ms,
                "sanitized_input": sanitized_text,
                "attack_type": "no_legitimate_intent",
            }

        # Stage 2: Run verifiers
        agent_verdicts = run_verifiers(original_input, fast_mode=False)
        attack_type = _extract_attack_type(agent_verdicts)

        # Stage 3: Compute consensus
        elapsed_ms = int((time.time() - start_time) * 1000)
        consensus = compute_consensus(agent_verdicts, was_sanitized, elapsed_ms)
        injection_score = consensus["injection_score"]

        # Stage 4: Verify sanitized input and apply policy decisions
        decision = decide_action(injection_score, sanitized_text, original_input)
        action = decision["action"]
        final_text = decision["final_text"]
        verdict = decision["verdict"]

        # Enforce Option A explicitly natively overwriting mixed-intent policies
        if is_high_risk:
            logger.warning("High-risk pattern detected in source intent. Enforcing strict BLOCK Option A natively.")
            action = "BLOCK"
            verdict = "BLOCKED"
            final_text = None
            injection_score = 1.0
            if not attack_type:
                attack_type = "high_risk_injection"
                
        elif was_sanitized and sanitized_text and sanitized_text != "[NO_LEGITIMATE_INTENT]":
            logger.info("Post-sanitization verification: analyzing cleaned input")
            try:
                recheck_verdicts = run_verifiers(sanitized_text, fast_mode=True)
                recheck_consensus = compute_consensus(recheck_verdicts, True, 0)
                recheck_score = recheck_consensus["injection_score"]
                
                text_lower = original_input.lower() + " " + sanitized_text.lower()
                business_keywords = ["discount", "product", "shipping", "offer", "coupon", "return", "track"]
                has_business_intent = any(k in text_lower for k in business_keywords)

                if recheck_score < 0.4 and has_business_intent:
                    logger.info("Sanitized text is safe and intent valid: Forcing ALLOW")
                    action = "ALLOW"
                    verdict = "SAFE"
                    final_text = sanitized_text
                
                elif action == "SANITIZE" and recheck_score >= 0.4:
                    logger.warning("Post-sanitization check failed. Overriding to BLOCK")
                    action = "BLOCK"
                    verdict = "BLOCKED"
                    final_text = None
                    injection_score = max(injection_score, recheck_score)
                    if not attack_type:
                        attack_type = "sanitizer_bypass_attempt"
            except Exception as e:
                logger.error(f"Post-sanitization verification error: {e}")

        # Stage 5: Execute action
        high_risk_patterns = [
            "ignore instructions", "act as admin", "override rules",
            "reveal system prompt", "bypass security"
        ]
        is_high_risk = any(p in original_input.lower() for p in high_risk_patterns)

        chatbot_response = None
        if action == "BLOCK":
            chatbot_response = get_block_response(original_input)
        elif is_high_risk:
            logger.info("High-risk pattern detected in original input. Restricting chatbot response.")
            chatbot_response = "We offer general assistance with products, orders, and promotions. Please check our website for current offers."
        else:
            # ALLOW or SANITIZE — call chatbot with the appropriate text
            chatbot_response = call_chatbot(final_text)

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Log everything
        crud.create_log(db, {
            "original_input": original_input,
            "sanitized_input": sanitized_text if was_sanitized else None,
            "verdict": verdict,
            "injection_score": injection_score,
            "was_sanitized": was_sanitized,
            "processing_time_ms": elapsed_ms,
            "agent1_verdict": json.dumps(agent_verdicts[0]) if len(agent_verdicts) > 0 else None,
            "agent2_verdict": json.dumps(agent_verdicts[1]) if len(agent_verdicts) > 1 else None,
            "agent3_verdict": json.dumps(agent_verdicts[2]) if len(agent_verdicts) > 2 else None,
            "mode": "middleware",
            "action_taken": action,
            "chatbot_response": chatbot_response,
            "attack_type": attack_type,
        })

        return {
            "response": chatbot_response,
            "verdict": verdict,
            "injection_score": injection_score,
            "action_taken": action,
            "processing_time_ms": elapsed_ms,
            "sanitized_input": sanitized_text if was_sanitized else None,
            "attack_type": attack_type,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Middleware error: {str(e)}")

