
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import AnalysisLog, DemoRun


def create_log(db: Session, data: dict) -> AnalysisLog:
    log = AnalysisLog(**data)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_logs(db: Session, verdict: str | None = None, limit: int = 100):
    query = db.query(AnalysisLog)
    if verdict:
        query = query.filter(AnalysisLog.verdict == verdict.upper())
    return query.order_by(AnalysisLog.id.desc()).limit(limit).all()


def get_stats(db: Session) -> dict:
    total = db.query(func.count(AnalysisLog.id)).scalar() or 0
    blocked = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.verdict == "BLOCKED").scalar() or 0
    flagged = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.verdict == "FLAGGED").scalar() or 0
    safe = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.verdict == "SAFE").scalar() or 0
    avg_score = db.query(func.avg(AnalysisLog.injection_score)).scalar() or 0.0
    avg_processing = db.query(func.avg(AnalysisLog.processing_time_ms)).scalar() or 0.0
    block_rate = (blocked / total * 100) if total > 0 else 0.0

    # Middleware-specific stats
    blocked_action = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.action_taken == "BLOCK").scalar() or 0
    sanitized_action = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.action_taken == "SANITIZE").scalar() or 0
    attacks_prevented = blocked_action + sanitized_action
    attack_rate = (attacks_prevented / total * 100) if total > 0 else 0.0

    # Extract top threat types from attack_type column
    from collections import Counter
    attack_rows = (
        db.query(AnalysisLog.attack_type)
        .filter(AnalysisLog.attack_type.isnot(None))
        .order_by(AnalysisLog.id.desc())
        .limit(500)
        .all()
    )
    threat_types = [row[0] for row in attack_rows if row[0]]
    top = [t for t, _ in Counter(threat_types).most_common(5)]

    return {
        "total_analyzed": total,
        "blocked_count": blocked,
        "flagged_count": flagged,
        "safe_count": safe,
        "block_rate_percent": round(block_rate, 2),
        "avg_injection_score": round(float(avg_score), 3),
        "top_threat_types": top,
        "attacks_prevented": attacks_prevented,
        "sanitized_count": sanitized_action,
        "blocked_action_count": blocked_action,
        "attack_rate_percent": round(attack_rate, 2),
        "avg_processing_time_ms": round(float(avg_processing), 0),
    }


def create_demo_run(db: Session, data: dict) -> DemoRun:
    run = DemoRun(**data)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
