from typing import List

WEIGHTS = {0: 0.35, 1: 0.40, 2: 0.25}

THRESHOLD_BLOCKED = 0.7
THRESHOLD_FLAGGED = 0.4


def compute_consensus(agent_verdicts: List[dict], was_sanitized: bool, processing_time_ms: int) -> dict:
    """
    Compute weighted consensus from agent verdicts.
    Returns full consensus result dict.
    """
    if not agent_verdicts:
        return {
            "verdict": "SAFE",
            "injection_score": 0.0,
            "agent_verdicts": [],
            "was_sanitized": was_sanitized,
            "processing_time_ms": processing_time_ms,
        }

    injection_score = 0.0
    total_weight = 0.0

    for i, verdict in enumerate(agent_verdicts):
        weight = WEIGHTS.get(i, 0.25)
        confidence = verdict.get("confidence", 0.5)
        is_injection = verdict.get("is_injection", False)

        contribution = confidence if is_injection else (1.0 - confidence)
        injection_score += weight * contribution
        total_weight += weight

    if total_weight > 0:
        injection_score = injection_score / total_weight

    injection_score = round(min(max(injection_score, 0.0), 1.0), 4)

    if injection_score >= THRESHOLD_BLOCKED:
        verdict = "BLOCKED"
    elif injection_score >= THRESHOLD_FLAGGED:
        verdict = "FLAGGED"
    else:
        verdict = "SAFE"

    return {
        "verdict": verdict,
        "injection_score": injection_score,
        "agent_verdicts": agent_verdicts,
        "was_sanitized": was_sanitized,
        "processing_time_ms": processing_time_ms,
    }
