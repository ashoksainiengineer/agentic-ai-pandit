from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


def new_uuid() -> str:
    return f"usr_{uuid.uuid4().hex[:24]}"


def new_session_id() -> str:
    return f"ses_{uuid.uuid4().hex[:24]}"


def new_job_id() -> str:
    return f"job_{uuid.uuid4().hex[:24]}"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    external_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    role: Mapped[str] = mapped_column(String, default="user", nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    sessions: Mapped[list[Session]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("users_external_id_idx", "external_id"),
        Index("users_email_idx", "email"),
        Index("users_is_active_idx", "is_active"),
        Index("users_role_idx", "role"),
        Index("users_deleted_at_idx", "deleted_at"),
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_session_id)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    external_id: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    date_of_birth: Mapped[str] = mapped_column(String, nullable=False)
    tentative_time: Mapped[str] = mapped_column(String, nullable=False)
    birth_place: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    gender: Mapped[str | None] = mapped_column(String, nullable=True)
    life_events: Mapped[str | None] = mapped_column(Text, nullable=True)
    spouse_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    offset_config: Mapped[str | None] = mapped_column(Text, nullable=True)
    rectified_time: Mapped[str | None] = mapped_column(String, nullable=True)
    accuracy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    analysis_result: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    progress_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    reasoning_logs: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String, default="draft", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_processing_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    retention_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ai_consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_consent_given_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ai_consent_ip: Mapped[str | None] = mapped_column(String, nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="sessions")
    jobs: Mapped[list[Job]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("sessions_user_id_idx", "user_id"),
        Index("sessions_status_idx", "status"),
        Index("sessions_user_status_idx", "user_id", "status"),
        Index("sessions_status_created_idx", "status", "created_at"),
        Index("sessions_created_at_idx", "created_at"),
        Index("sessions_submitted_at_idx", "submitted_at"),
        Index("sessions_retention_idx", "retention_until"),
        Index("sessions_deleted_at_idx", "deleted_at"),
    )


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_job_id)
    session_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    kind: Mapped[str] = mapped_column(
        String, default="btr_rectification", nullable=False
    )
    status: Mapped[str] = mapped_column(String, default="queued", nullable=False)
    current_stage: Mapped[str | None] = mapped_column(String, nullable=True)
    cursor_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    checkpoint_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    attempt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    retry_reason_code: Mapped[str | None] = mapped_column(String, nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    queued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    heartbeat_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error_code: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    session: Mapped[Session] = relationship(back_populates="jobs")
    attempts: Mapped[list[JobAttempt]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
    events: Mapped[list[JobEvent]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("jobs_session_id_idx", "session_id"),
        Index("jobs_user_id_idx", "user_id"),
        Index("jobs_session_kind_idx", "session_id", "kind"),
        Index("jobs_status_created_idx", "status", "created_at"),
        Index("jobs_status_priority_created_idx", "status", "priority", "created_at"),
        Index("jobs_retry_schedule_idx", "status", "next_retry_at"),
        Index("jobs_heartbeat_idx", "heartbeat_at"),
        Index("jobs_user_status_idx", "user_id", "status"),
        CheckConstraint(
            "progress_percent >= 0 AND progress_percent <= 100",
            name="jobs_progress_percent_check",
        ),
        CheckConstraint("attempt >= 0", name="jobs_attempt_check"),
        CheckConstraint("retry_count >= 0", name="jobs_retry_count_check"),
        CheckConstraint("max_attempts >= 1", name="jobs_max_attempts_check"),
        CheckConstraint("priority >= 0", name="jobs_priority_check"),
        CheckConstraint("version >= 0", name="jobs_version_check"),
    )


class JobAttempt(Base):
    __tablename__ = "job_attempts"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"jat_{uuid.uuid4().hex[:24]}"
    )
    job_id: Mapped[str] = mapped_column(String, nullable=False)
    attempt_no: Mapped[int] = mapped_column(Integer, nullable=False)
    worker_id: Mapped[str | None] = mapped_column(String, nullable=True)
    lease_token: Mapped[str | None] = mapped_column(String, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    heartbeat_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    outcome: Mapped[str] = mapped_column(String, default="running", nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_code: Mapped[str | None] = mapped_column(String, nullable=True)
    checkpoint_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    job: Mapped[Job] = relationship(back_populates="attempts")

    __table_args__ = (
        Index("job_attempts_job_id_idx", "job_id"),
        Index("job_attempts_heartbeat_idx", "heartbeat_at"),
        UniqueConstraint(
            "job_id", "attempt_no", name="job_attempts_job_attempt_unique"
        ),
        CheckConstraint("attempt_no >= 1", name="job_attempts_attempt_no_check"),
    )


class JobEvent(Base):
    __tablename__ = "job_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"evt_{uuid.uuid4().hex[:24]}"
    )
    job_id: Mapped[str] = mapped_column(String, nullable=False)
    session_id: Mapped[str] = mapped_column(String, nullable=False)
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    stage: Mapped[str | None] = mapped_column(String, nullable=True)
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    job: Mapped[Job] = relationship(back_populates="events")

    __table_args__ = (
        UniqueConstraint("job_id", "sequence_no", name="job_events_job_seq_unique"),
        Index("job_events_job_created_idx", "job_id", "created_at"),
        Index("job_events_session_created_idx", "session_id", "created_at"),
    )


class SessionFavorite(Base):
    __tablename__ = "session_favorites"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"fav_{uuid.uuid4().hex[:24]}"
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    session_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("session_favorites_user_id_idx", "user_id"),
        Index("session_favorites_session_id_idx", "session_id"),
        UniqueConstraint(
            "user_id", "session_id", name="session_favorites_user_session_unique"
        ),
    )


class Calculation(Base):
    __tablename__ = "calculations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"cal_{uuid.uuid4().hex[:24]}"
    )
    session_id: Mapped[str] = mapped_column(String, nullable=False)
    birth_date_time: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    ephemeris_data: Mapped[str] = mapped_column(Text, nullable=False)
    algorithm_version: Mapped[str] = mapped_column(
        String, default="2.0.0", nullable=False
    )
    ephemeris_version: Mapped[str] = mapped_column(
        String, default="de440", nullable=False
    )
    processing_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cache_hit_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("calculations_session_id_idx", "session_id"),
        Index("calculations_created_at_idx", "created_at"),
        Index("calculations_expires_idx", "expires_at"),
        Index("calculations_session_created_idx", "session_id", "created_at"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"aud_{uuid.uuid4().hex[:24]}"
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    user_role: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    resource: Mapped[str] = mapped_column(String, nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    old_values: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_values: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("audit_logs_user_id_idx", "user_id"),
        Index("audit_logs_action_idx", "action"),
        Index("audit_logs_resource_idx", "resource"),
        Index("audit_logs_user_created_idx", "user_id", "created_at"),
        Index("audit_logs_resource_action_idx", "resource", "action"),
        Index("audit_logs_created_at_idx", "created_at"),
    )


class DataRetention(Base):
    __tablename__ = "data_retention"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"ret_{uuid.uuid4().hex[:24]}"
    )
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True)
    data_type: Mapped[str] = mapped_column(String, nullable=False)
    retention_days: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_deletion_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    actually_deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String, default="scheduled", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("data_retention_user_id_idx", "user_id"),
        Index("data_retention_session_id_idx", "session_id"),
        Index("data_retention_status_idx", "status"),
        Index("data_retention_scheduled_idx", "scheduled_deletion_at", "status"),
    )


class Artifact(Base):
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"art_{uuid.uuid4().hex[:24]}"
    )
    job_id: Mapped[str] = mapped_column(String, nullable=False)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True)
    kind: Mapped[str] = mapped_column(String, default="other", nullable=False)
    uri: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String, nullable=True)
    checksum: Mapped[str | None] = mapped_column(String, nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("artifacts_job_kind_idx", "job_id", "kind"),
        Index("artifacts_session_id_idx", "session_id"),
    )


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: f"idem_{uuid.uuid4().hex[:24]}"
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    key: Mapped[str] = mapped_column(String, nullable=False)
    request_hash: Mapped[str] = mapped_column(String, nullable=False)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True)
    job_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("user_id", "key", name="idempotency_keys_user_key_unique"),
        Index("idempotency_keys_expires_idx", "expires_at"),
        Index("idempotency_keys_job_id_idx", "job_id"),
        Index("idempotency_keys_request_hash_idx", "request_hash"),
    )
