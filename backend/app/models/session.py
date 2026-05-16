from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.models.events import LifeEvent, SessionStatus, TimeOffsetConfig


class RectificationSession(BaseModel):
    id: str
    user_id: str
    external_id: str
    full_name: str
    date_of_birth: str
    tentative_time: str
    birth_place: str
    latitude: float
    longitude: float
    timezone: str | float
    gender: str | None = None
    life_events: list[LifeEvent]
    offset_config: TimeOffsetConfig | None = None
    rectified_time: str | None = None
    accuracy: float | None = None
    confidence: str | None = None
    analysis_result: Any = None
    progress_data: str | None = None
    status: SessionStatus
    error_message: str | None = None
    created_at: str
    updated_at: str
    completed_at: str | None = None


class MasterAnalysisArchive(BaseModel):
    version: str
    session_id: str
    generated_at: str
    birth_context: dict[str, str]
    final_result: dict[str, Any]
    reasoning: dict[str, str]
    technical_proof: dict[str, Any]
    alternatives: list[dict[str, Any]]
