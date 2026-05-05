from typing import Any

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    input: str
    mode: str = "strict"  


class SecureChatRequest(BaseModel):
    input: str
    original_input: str | None = None


class SecureChatResponse(BaseModel):
    response: str
    verdict: str  # BLOCKED | FLAGGED | SAFE
    injection_score: float
    action_taken: str  # BLOCK | SANITIZE | ALLOW
    processing_time_ms: int
    sanitized_input: str | None = None
    attack_type: str | None = None


class AgentVerdict(BaseModel):
    agent: str
    is_injection: bool
    confidence: float
    reason: str


class SanitizerResult(BaseModel):
    sanitized_text: str
    was_modified: bool
    original_length: int
    sanitized_length: int


class ConsensusResult(BaseModel):
    verdict: str  # BLOCKED | FLAGGED | SAFE
    injection_score: float
    agent_verdicts: list[Any]
    was_sanitized: bool
    processing_time_ms: int
    sanitized_text: str | None = None
    original_input: str | None = None


class LogEntry(BaseModel):
    id: int
    timestamp: str
    original_input: str
    sanitized_input: str | None
    verdict: str
    injection_score: float
    was_sanitized: bool
    processing_time_ms: int
    agent1_verdict: str | None
    agent2_verdict: str | None
    agent3_verdict: str | None
    mode: str
    action_taken: str | None = None
    chatbot_response: str | None = None
    attack_type: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_analyzed: int
    blocked_count: int
    flagged_count: int
    safe_count: int
    block_rate_percent: float
    avg_injection_score: float
    top_threat_types: list[str]
    attacks_prevented: int = 0
    sanitized_count: int = 0
    blocked_action_count: int = 0
    attack_rate_percent: float = 0.0
    avg_processing_time_ms: float = 0.0


class DemoRunResult(BaseModel):
    id: int
    timestamp: str
    total_samples: int
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float

    class Config:
        from_attributes = True


class DemoSampleResult(BaseModel):
    input: str
    ground_truth: str
    pipeline_verdict: str
    injection_score: float
    match: bool


class DemoBatchResult(BaseModel):
    samples: list[DemoSampleResult]
    precision: float
    recall: float
    f1_score: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    total_samples: int
    baseline_f1: float | None = None
    pipeline_f1: float | None = None
    improvement_percent: float | None = None
