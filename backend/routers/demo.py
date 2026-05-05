import json
import logging
import time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dataset.loader import get_demo_samples
from db import crud
from db.database import get_db
from models.schemas import DemoBatchResult
from pipeline.consensus import compute_consensus
from pipeline.sanitizer import sanitize_input
from pipeline.verifier import run_verifiers

router = APIRouter()

logger = logging.getLogger(__name__)


def _run_pipeline(prompt, use_sanitizer=True):
    """
    Run the detection pipeline on a single prompt.
    If use_sanitizer=True, runs full pipeline (sanitize + verify).
    If use_sanitizer=False, runs baseline (verify only, no sanitizer).
    """
    start = time.time()
    sanitized = prompt
    was_sanitized = False

    if use_sanitizer:
        try:
            san = sanitize_input(prompt)
            sanitized = san.get("sanitized_text", prompt)
            was_sanitized = san.get("was_modified", False)
        except Exception:
            pass

    verdicts = run_verifiers(prompt, fast_mode=False)
    elapsed = int((time.time() - start) * 1000)
    consensus = compute_consensus(verdicts, was_sanitized, elapsed)
    return consensus, verdicts, sanitized, was_sanitized, elapsed


def _compute_f1(tp, fp, fn):
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    return precision, recall, f1


@router.post("/demo/run", response_model=DemoBatchResult)
async def run_demo(db: Session = Depends(get_db)):
    samples = get_demo_samples(n=10)
    results = []

    # Full pipeline counters
    tp = fp = tn = fn = 0
    # Baseline counters (no sanitizer)
    b_tp = b_fp = b_tn = b_fn = 0

    for sample in samples:
        prompt = sample["prompt"]
        ground_truth_label = sample.get("label", "unknown")
        ground_truth_is_injection = ground_truth_label in ("injection", "harmful", "jailbreak", "adversarial")

        # ── Baseline: verifiers only, no sanitizer ──
        try:
            baseline_verdicts = run_verifiers(prompt, fast_mode=False)
            baseline_consensus = compute_consensus(baseline_verdicts, False, 0)
            baseline_is_injection = baseline_consensus["verdict"] in ("BLOCKED", "FLAGGED")

            if ground_truth_is_injection and baseline_is_injection:
                b_tp += 1
            elif not ground_truth_is_injection and baseline_is_injection:
                b_fp += 1
            elif not ground_truth_is_injection and not baseline_is_injection:
                b_tn += 1
            else:
                b_fn += 1
        except Exception as e:
            logger.error(f"Baseline failed for sample: {e}")
            b_fn += 1

        time.sleep(1)  # Rate limit safety between baseline and full pipeline

        # ── Full pipeline: sanitizer + verifiers ──
        try:
            consensus, verdicts, sanitized, was_sanitized, elapsed = _run_pipeline(prompt, use_sanitizer=True)

            pipeline_verdict = consensus["verdict"]
            pipeline_is_injection = pipeline_verdict in ("BLOCKED", "FLAGGED")

            # Confusion matrix
            if ground_truth_is_injection and pipeline_is_injection:
                tp += 1
            elif not ground_truth_is_injection and pipeline_is_injection:
                fp += 1
            elif not ground_truth_is_injection and not pipeline_is_injection:
                tn += 1
            else:
                fn += 1

            match = (ground_truth_is_injection == pipeline_is_injection)

            results.append({
                "input": prompt[:200],
                "ground_truth": "injection" if ground_truth_is_injection else "legitimate",
                "pipeline_verdict": pipeline_verdict,
                "injection_score": consensus["injection_score"],
                "match": match,
            })

            # Log to DB
            crud.create_log(db, {
                "original_input": prompt,
                "sanitized_input": sanitized if was_sanitized else None,
                "verdict": pipeline_verdict,
                "injection_score": consensus["injection_score"],
                "was_sanitized": was_sanitized,
                "processing_time_ms": elapsed,
                "agent1_verdict": json.dumps(verdicts[0]) if len(verdicts) > 0 else None,
                "agent2_verdict": json.dumps(verdicts[1]) if len(verdicts) > 1 else None,
                "agent3_verdict": json.dumps(verdicts[2]) if len(verdicts) > 2 else None,
                "mode": "demo",
            })

        except Exception as e:
            logger.error(f"Demo sample failed: {e}")
            fn += 1
            results.append({
                "input": prompt[:200],
                "ground_truth": "injection" if ground_truth_is_injection else "legitimate",
                "pipeline_verdict": "ERROR",
                "injection_score": 0.0,
                "match": False,
            })

        time.sleep(1)  # Rate limit safety between samples

    # Compute metrics
    precision, recall, f1 = _compute_f1(tp, fp, fn)
    _, _, baseline_f1 = _compute_f1(b_tp, b_fp, b_fn)

    # Improvement percentage
    if baseline_f1 > 0:
        improvement = ((f1 - baseline_f1) / baseline_f1) * 100
    else:
        improvement = 100.0 if f1 > 0 else 0.0

    logger.info(
        f"Demo results — Baseline F1: {baseline_f1:.2%}, Pipeline F1: {f1:.2%}, "
        f"Improvement: {improvement:.1f}%"
    )

    # Attack success rate comparison
    baseline_attack_miss = b_fn / (b_tp + b_fn) * 100 if (b_tp + b_fn) > 0 else 0
    pipeline_attack_miss = fn / (tp + fn) * 100 if (tp + fn) > 0 else 0
    logger.info(
        f"Attack success reduced from {baseline_attack_miss:.1f}% to {pipeline_attack_miss:.1f}%"
    )

    # Save demo run
    crud.create_demo_run(db, {
        "total_samples": len(samples),
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
    })

    return {
        "samples": results,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "total_samples": len(samples),
        "baseline_f1": round(baseline_f1, 4),
        "pipeline_f1": round(f1, 4),
        "improvement_percent": round(improvement, 1),
    }
