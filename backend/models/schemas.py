from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class AnalyzeRequest(BaseModel):
    input: str
    mode: str = "strict"  


class SecureChatRequest(BaseModel):
    input: str
    original_input: Optional[str] = None


class SecureChatResponse(BaseModel):
    response: str
    verdict: str  # BLOCKED | FLAGGED | SAFE
    injection_score: float
    action_taken: str  # BLOCK | SANITIZE | ALLOW
    processing_time_ms: int
    sanitized_input: Optional[str] = None
    attack_type: Optional[str] = None


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
    agent_verdicts: List[Any]
    was_sanitized: bool
    processing_time_ms: int
    sanitized_text: Optional[str] = None
    original_input: Optional[str] = None


class LogEntry(BaseModel):
    id: int
    timestamp: str
    original_input: str
    sanitized_input: Optional[str]
    verdict: str
    injection_score: float
    was_sanitized: bool
    processing_time_ms: int
    agent1_verdict: Optional[str]
    agent2_verdict: Optional[str]
    agent3_verdict: Optional[str]
    mode: str
    action_taken: Optional[str] = None
    chatbot_response: Optional[str] = None
    attack_type: Optional[str] = None
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
    top_threat_types: List[str]
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
    samples: List[DemoSampleResult]
    precision: float
    recall: float
    f1_score: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    total_samples: int
    baseline_f1: Optional[float] = None
    pipeline_f1: Optional[float] = None
    improvement_percent: Optional[float] = None
