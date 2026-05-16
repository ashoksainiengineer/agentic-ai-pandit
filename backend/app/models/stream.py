from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class QueuePosition(BaseModel):
    session_id: str
    status: str
    position: int
    estimated_wait_seconds: int
    total_in_queue: int
    created_at: str
    session: dict[str, Any] | None = None


class QueueSubmitResult(BaseModel):
    success: bool
    session_id: str | None = None
    position: int | None = None
    estimated_wait_seconds: int | None = None
    error: str | None = None
    error_code: str | None = None
    retry_after_seconds: int | None = None


class JobSummary(BaseModel):
    id: str
    session_id: str
    user_id: str
    kind: str
    status: str
    current_stage: str | None = None
    progress_percent: int = Field(..., ge=0, le=100)
    attempt: int = 0
    max_attempts: int = 1
    retry_count: int = 0
    retry_reason_code: str | None = None
    next_retry_at: str | None = None
    queued_at: str
    started_at: str | None = None
    heartbeat_at: str | None = None
    finished_at: str | None = None
    cancel_requested_at: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str


class JobDetail(JobSummary):
    version: int = 0
    result: dict[str, Any] | None = None
    checkpoint: dict[str, Any] | None = None
    cursor: dict[str, Any] | None = None
    session_status: str | None = None


class JobEventRecord(BaseModel):
    id: str
    job_id: str
    session_id: str
    sequence_no: int
    event_type: str
    stage: str | None = None
    payload: dict[str, Any]
    created_at: str


class JobEventsResponse(BaseModel):
    job_id: str
    session_id: str
    since: int
    events: list[JobEventRecord]


class JobSyncResponse(BaseModel):
    job: JobDetail
    since: int
    latest_sequence_no: int
    events: list[JobEventRecord]
    recommended_poll_interval_ms: int
    replay_mode: str


class DeadLetterArtifactSummary(BaseModel):
    id: str
    job_id: str
    session_id: str | None = None
    uri: str
    created_at: str
    metadata: dict[str, Any] | None = None


class CreateJobResponse(BaseModel):
    job: JobDetail
    idempotent_replay: bool


class CancelJobResponse(BaseModel):
    job: JobDetail
    cancelled: bool


class ProgressStep(BaseModel):
    id: str
    name: str
    icon: str
    status: str
    message: str | None = None
    details: list[str] | None = None
    started_at: str | None = None
    completed_at: str | None = None


class AIThinkingData(BaseModel):
    stage: int
    candidate_time: str | None = None
    chunks: list[str]
    full_text: str


class AIContextData(BaseModel):
    stage: int
    candidate_time: str
    planetary_info: dict[str, str]
    dasha: str
    div_charts: str | None = None
    ground_truth: dict[str, Any] | None = None


class CandidateScore(BaseModel):
    time: str
    score: float | None = None
    stage: int | None = None
    rank: int | None = None
    batch: int | None = None
    minified_eph: dict[str, str] | None = None
    full_eph: dict[str, str] | None = None
    reason: str | None = None
    time_string: str | None = None
    overall_score: float | None = None
    confidence_level: str | None = None
    margin_of_error_seconds: float | None = None
    method_scores: dict[str, float] | None = None
    event_matches: list[dict[str, Any]] | None = None
    transit_matches: list[dict[str, Any]] | None = None
    red_flags: list[str] | None = None
    key_evidence: list[str] | None = None


class ProgressData(BaseModel):
    current_step: int
    total_steps: int
    percentage: float
    steps: list[ProgressStep]
    last_update: str
    live_message: str | None = None
    started_at: str | None = None
    candidate_scores: list[CandidateScore] = []
    last_ai_thinking: AIThinkingData | None = None
    ai_context: AIContextData | None = None
    stage_history: dict[int, str] | None = None
    calculation_logs: list[dict[str, str]] | None = None
    estimated_time_remaining: float | None = None


class ProgressEvent(BaseModel):
    type: str = "progress"
    step: str
    step_index: int
    total_steps: int
    percentage: float
    message: str
    details: list[str] | None = None
    started_at: str | None = None


class AIThinkingEvent(BaseModel):
    type: str = "ai_thinking"
    chunk: str
    stage: int
    candidate_time: str | None = None


class EphemerisEvent(BaseModel):
    type: str = "ephemeris"
    candidate_time: str
    ascendant: dict[str, Any]
    moon_sign: str
    moon_nakshatra: str


class CandidateScoreEvent(BaseModel):
    type: str = "candidate_score"
    time: str
    score: float
    stage: int
    batch: int | None = None
    rank: int | None = None
    minified_eph: dict[str, str] | None = None
    full_eph: dict[str, str] | None = None
    reason: str | None = None


class CandidateScoresEvent(BaseModel):
    type: str = "candidate_scores"
    data: list[CandidateScoreEvent]


class CompleteEvent(BaseModel):
    type: str = "complete"
    rectified_time: str
    accuracy: float
    confidence: str


class AIContextEvent(BaseModel):
    type: str = "ai_context"
    stage: int
    candidate_time: str
    planetary_info: dict[str, str] | None = None
    dasha: str | None = None
    div_charts: str | None = None
    context_hits: list[str] | None = None
    round: int | None = None
    batch: int | None = None
    total_batches: int | None = None
    candidates_in_batch: Any = None
    life_events_count: int | None = None


class DecisionEvent(BaseModel):
    type: str = "decision"
    stage: int
    time: str
    verdict: str
    score: float
    reason: str
    batch: int | None = None


class CalculationLogEvent(BaseModel):
    type: str = "calculation_log"
    log_id: str
    candidate_time: str
    sun_pos: str
    moon_pos: str
    ascendant: str
    dasha_obj: str | None = None


class ErrorEvent(BaseModel):
    type: str = "error"
    message: str
    stage: str | None = None


class StageStatsEvent(BaseModel):
    type: str = "stage_stats"
    stage: int
    candidate_count: int
    description: str


class EstimatedTimeEvent(BaseModel):
    type: str = "estimated_time"
    seconds: int


class BatchConclusionEvent(BaseModel):
    type: str = "batch_conclusion"
    stage: int
    round: int
    batch: int
    total_batches: int
    conclusion: str
    candidates_in_batch: int
    survivors_count: int


class StageConclusionEvent(BaseModel):
    type: str = "stage_conclusion"
    stage: int
    stage_name: str
    candidates_in: int
    candidates_out: int
    conclusion: str
    top_candidate_times: list[str]


class AIMessage(BaseModel):
    role: str
    content: str


class AIResponse(BaseModel):
    success: bool
    thinking: str | None = None
    content: str
    tokens_used: int | None = None
    error: str | None = None


class CalculateRequest(BaseModel):
    birth_data: Any
    life_events: list[Any]
    offset_config: Any


class CalculateResponse(BaseModel):
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None


class BTRInput(BaseModel):
    birth_date: str
    time_estimate: str
    offset_config: Any
    life_events: list[Any]
    latitude: float
    longitude: float
    timezone: float


class CandidateAnalysis(BaseModel):
    time: str
    offset_minutes: int
    offset_description: str
    ephemeris_data: Any
    quick_score: float
    event_matches: int
    should_analyze_with_ai: bool
    reason: str
    metadata: dict[str, Any] | None = None


class RankedCandidates(BaseModel):
    top_candidates: list[CandidateAnalysis]
    all_candidates: list[CandidateAnalysis]
    total_analyzed: int


class AIAnalysisResult(BaseModel):
    time: str
    offset_minutes: int
    offset_description: str
    score: float
    confidence: str
    analysis: str
    thinking: str
    event_matches: list[dict[str, Any]]
    recommendation: str
    dasha_analysis: str
    transit_analysis: str


class TopCandidatesAnalysis(BaseModel):
    candidates: list[AIAnalysisResult]
    top_recommendation: AIAnalysisResult
    alternative_options: list[AIAnalysisResult]
    processing_time: float


class BTROutput(BaseModel):
    rectified_time: str
    accuracy: float
    confidence: str
    processing_time: float
    analysis: dict[str, Any]
    thinking: str | None = None
    ephemeris: Any = None


class SecondsPrecisionInput(BaseModel):
    session_id: str
    job_id: str | None = None
    date_of_birth: str
    tentative_time: str
    latitude: float
    longitude: float
    timezone: str | float
    life_events: list[Any]
    offset_config: Any
    spouse_data: dict[str, Any] | None = None
    abort_signal: Any = None


class SecondsPrecisionResult(BaseModel):
    rectified_time: str
    accuracy: float
    confidence: str
    precision_level: str
    margin_of_error: float
    stages_completed: int
    boundary_warnings: list[str]
    methods_used: list[str]
    processing_time_ms: float
    analysis_result: dict[str, Any]
    narrative_manifest: dict[str, str] | None = None
