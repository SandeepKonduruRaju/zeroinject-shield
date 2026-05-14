"""
Tests for pipeline/consensus.py

We test the weighted scoring logic in isolation — no API calls needed.
The function is pure: same inputs always produce the same outputs.
"""

import pytest

from pipeline.consensus import THRESHOLD_BLOCKED, THRESHOLD_FLAGGED, compute_consensus

# ── Helpers ────────────────────────────────────────────────────────────────

def make_verdict(is_injection: bool, confidence: float) -> dict:
    """Build a minimal agent verdict dict for tests."""
    return {"is_injection": is_injection, "confidence": confidence}


# ── Edge cases ─────────────────────────────────────────────────────────────

def test_empty_verdicts_returns_safe():
    """
    WHY: If no agents ran (network failure, fast-mode skip), we must not
    crash or block legitimate users. Default to SAFE.
    """
    result = compute_consensus([], was_sanitized=False, processing_time_ms=0)

    assert result["verdict"] == "SAFE"
    assert result["injection_score"] == 0.0
    assert result["agent_verdicts"] == []


# ── BLOCKED cases ──────────────────────────────────────────────────────────

def test_all_agents_certain_injection_is_blocked():
    """
    WHY: When all 3 agents are highly confident it's an injection,
    the score must exceed 0.7 and result in BLOCKED.
    Manual calc: (0.35×0.99 + 0.40×0.99 + 0.25×0.99) / 1.0 = 0.99
    """
    verdicts = [
        make_verdict(is_injection=True, confidence=0.99),  # Agent 0
        make_verdict(is_injection=True, confidence=0.99),  # Agent 1
        make_verdict(is_injection=True, confidence=0.99),  # Agent 2
    ]
    result = compute_consensus(verdicts, was_sanitized=False, processing_time_ms=100)

    assert result["verdict"] == "BLOCKED"
    assert result["injection_score"] >= THRESHOLD_BLOCKED


def test_two_agents_high_confidence_injection_is_blocked():
    """
    WHY: Even if Agent 2 (weight 0.25) says it's safe, agents 0 and 1
    together (weight 0.75) being highly confident should still block.
    Manual calc: (0.35×0.95 + 0.40×0.95 + 0.25×0.10) / 1.0 = 0.3325 + 0.38 + 0.025 = 0.7375
    """
    verdicts = [
        make_verdict(is_injection=True, confidence=0.95),   # Agent 0 — injection
        make_verdict(is_injection=True, confidence=0.95),   # Agent 1 — injection
        make_verdict(is_injection=False, confidence=0.90),  # Agent 2 — safe (disagreeing)
    ]
    result = compute_consensus(verdicts, was_sanitized=False, processing_time_ms=200)

    assert result["verdict"] == "BLOCKED"
    assert result["injection_score"] >= THRESHOLD_BLOCKED


# ── SAFE cases ─────────────────────────────────────────────────────────────

def test_all_agents_certain_safe_is_allowed():
    """
    WHY: A legitimate user query should never be blocked.
    When all agents agree it's safe with high confidence, score must be near 0.
    Manual calc: (0.35×0.01 + 0.40×0.01 + 0.25×0.01) / 1.0 = 0.01
    """
    verdicts = [
        make_verdict(is_injection=False, confidence=0.99),  # Agent 0 — safe
        make_verdict(is_injection=False, confidence=0.99),  # Agent 1 — safe
        make_verdict(is_injection=False, confidence=0.99),  # Agent 2 — safe
    ]
    result = compute_consensus(verdicts, was_sanitized=False, processing_time_ms=150)

    assert result["verdict"] == "SAFE"
    assert result["injection_score"] < THRESHOLD_FLAGGED


# ── FLAGGED cases ──────────────────────────────────────────────────────────

def test_mixed_signals_produces_flagged():
    """
    WHY: When agents genuinely disagree (uncertain input), the score lands
    in the 0.4–0.7 range → FLAGGED → middleware will sanitize, not block.
    Manual calc: (0.35×0.60 + 0.40×0.30 + 0.25×0.60) / 1.0 = 0.21 + 0.12 + 0.15 = 0.48
    """
    verdicts = [
        make_verdict(is_injection=True, confidence=0.60),   # Agent 0 — leans injection
        make_verdict(is_injection=False, confidence=0.70),  # Agent 1 — leans safe
        make_verdict(is_injection=True, confidence=0.60),   # Agent 2 — leans injection
    ]
    result = compute_consensus(verdicts, was_sanitized=False, processing_time_ms=300)

    assert result["verdict"] == "FLAGGED"
    assert THRESHOLD_FLAGGED <= result["injection_score"] < THRESHOLD_BLOCKED


# ── Single agent (fast mode) ───────────────────────────────────────────────

def test_single_agent_fast_mode_works():
    """
    WHY: fast_mode=True only runs Agent 0. The function must handle
    a list with just 1 verdict without crashing or giving wrong results.
    """
    verdicts = [
        make_verdict(is_injection=True, confidence=0.90),  # Only Agent 0
    ]
    result = compute_consensus(verdicts, was_sanitized=False, processing_time_ms=50)

    # Agent 0 weight=0.35, contribution=0.90 → score = 0.35*0.90/0.35 = 0.90
    assert result["verdict"] == "BLOCKED"
    assert result["injection_score"] == pytest.approx(0.90, abs=0.01)


# ── Score boundaries ───────────────────────────────────────────────────────

def test_score_is_clamped_between_0_and_1():
    """
    WHY: Floating point arithmetic can sometimes produce values slightly
    outside [0, 1]. The clamp on line 37 must prevent that.
    """
    verdicts = [
        make_verdict(is_injection=True, confidence=1.0),
        make_verdict(is_injection=True, confidence=1.0),
        make_verdict(is_injection=True, confidence=1.0),
    ]
    result = compute_consensus(verdicts, was_sanitized=True, processing_time_ms=10)

    assert 0.0 <= result["injection_score"] <= 1.0


def test_was_sanitized_flag_is_passed_through():
    """
    WHY: The consensus function must preserve metadata (was_sanitized,
    processing_time_ms) so the caller can log it correctly.
    """
    verdicts = [make_verdict(is_injection=False, confidence=0.8)]
    result = compute_consensus(verdicts, was_sanitized=True, processing_time_ms=999)

    assert result["was_sanitized"] is True
    assert result["processing_time_ms"] == 999
