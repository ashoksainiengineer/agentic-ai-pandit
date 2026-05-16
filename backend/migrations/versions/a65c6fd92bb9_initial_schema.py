"""initial_schema

Revision ID: a65c6fd92bb9
Revises:
Create Date: 2026-05-16 15:11:55.974607
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "a65c6fd92bb9"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("external_id", sa.String(), nullable=False, unique=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("role", sa.String(), nullable=False, server_default=sa.text("'user'")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("users_external_id_idx", "users", ["external_id"])
    op.create_index("users_email_idx", "users", ["email"])
    op.create_index("users_is_active_idx", "users", ["is_active"])
    op.create_index("users_role_idx", "users", ["role"])
    op.create_index("users_deleted_at_idx", "users", ["deleted_at"])

    # --- sessions ---
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("date_of_birth", sa.String(), nullable=False),
        sa.Column("tentative_time", sa.String(), nullable=False),
        sa.Column("birth_place", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("timezone", sa.String(), nullable=False),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("life_events", sa.Text(), nullable=True),
        sa.Column("spouse_data", sa.Text(), nullable=True),
        sa.Column("offset_config", sa.Text(), nullable=True),
        sa.Column("rectified_time", sa.String(), nullable=True),
        sa.Column("accuracy", sa.Integer(), nullable=True),
        sa.Column("confidence", sa.String(), nullable=True),
        sa.Column("analysis_result", JSONB(), nullable=True),
        sa.Column("progress_data", JSONB(), nullable=True),
        sa.Column("reasoning_logs", JSONB(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("error_code", sa.String(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_processing_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("retention_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_consent_given", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("ai_consent_given_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_consent_ip", sa.String(), nullable=True),
        sa.Column("is_encrypted", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("sessions_user_id_idx", "sessions", ["user_id"])
    op.create_index("sessions_status_idx", "sessions", ["status"])
    op.create_index("sessions_user_status_idx", "sessions", ["user_id", "status"])
    op.create_index("sessions_status_created_idx", "sessions", ["status", "created_at"])
    op.create_index("sessions_created_at_idx", "sessions", ["created_at"])
    op.create_index("sessions_submitted_at_idx", "sessions", ["submitted_at"])
    op.create_index("sessions_retention_idx", "sessions", ["retention_until"])
    op.create_index("sessions_deleted_at_idx", "sessions", ["deleted_at"])

    # --- jobs ---
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False, server_default=sa.text("'btr_rectification'")),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'queued'")),
        sa.Column("current_stage", sa.String(), nullable=True),
        sa.Column("cursor_json", JSONB(), nullable=True),
        sa.Column("checkpoint_json", JSONB(), nullable=True),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default=sa.text("100")),
        sa.Column("attempt", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default=sa.text("3")),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("retry_reason_code", sa.String(), nullable=True),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("result_json", JSONB(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("progress_percent >= 0 AND progress_percent <= 100", name="jobs_progress_percent_check"),
        sa.CheckConstraint("attempt >= 0", name="jobs_attempt_check"),
        sa.CheckConstraint("retry_count >= 0", name="jobs_retry_count_check"),
        sa.CheckConstraint("max_attempts >= 1", name="jobs_max_attempts_check"),
        sa.CheckConstraint("priority >= 0", name="jobs_priority_check"),
        sa.CheckConstraint("version >= 0", name="jobs_version_check"),
    )
    op.create_index("jobs_session_id_idx", "jobs", ["session_id"])
    op.create_index("jobs_user_id_idx", "jobs", ["user_id"])
    op.create_index("jobs_session_kind_idx", "jobs", ["session_id", "kind"])
    op.create_index("jobs_status_created_idx", "jobs", ["status", "created_at"])
    op.create_index("jobs_status_priority_created_idx", "jobs", ["status", "priority", "created_at"])
    op.create_index("jobs_retry_schedule_idx", "jobs", ["status", "next_retry_at"])
    op.create_index("jobs_heartbeat_idx", "jobs", ["heartbeat_at"])
    op.create_index("jobs_user_status_idx", "jobs", ["user_id", "status"])

    # --- job_attempts ---
    op.create_table(
        "job_attempts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("job_id", sa.String(), nullable=False),
        sa.Column("attempt_no", sa.Integer(), nullable=False),
        sa.Column("worker_id", sa.String(), nullable=True),
        sa.Column("lease_token", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("outcome", sa.String(), nullable=False, server_default=sa.text("'running'")),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("failure_code", sa.String(), nullable=True),
        sa.Column("checkpoint_json", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("job_id", "attempt_no", name="job_attempts_job_attempt_unique"),
        sa.CheckConstraint("attempt_no >= 1", name="job_attempts_attempt_no_check"),
    )
    op.create_index("job_attempts_job_id_idx", "job_attempts", ["job_id"])
    op.create_index("job_attempts_heartbeat_idx", "job_attempts", ["heartbeat_at"])

    # --- job_events ---
    op.create_table(
        "job_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("job_id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("payload_json", JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("job_id", "sequence_no", name="job_events_job_seq_unique"),
    )
    op.create_index("job_events_job_created_idx", "job_events", ["job_id", "created_at"])
    op.create_index("job_events_session_created_idx", "job_events", ["session_id", "created_at"])

    # --- session_favorites ---
    op.create_table(
        "session_favorites",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "session_id", name="session_favorites_user_session_unique"),
    )
    op.create_index("session_favorites_user_id_idx", "session_favorites", ["user_id"])
    op.create_index("session_favorites_session_id_idx", "session_favorites", ["session_id"])

    # --- calculations ---
    op.create_table(
        "calculations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("birth_date_time", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("timezone", sa.String(), nullable=False),
        sa.Column("ephemeris_data", sa.Text(), nullable=False),
        sa.Column("algorithm_version", sa.String(), nullable=False, server_default=sa.text("'2.0.0'")),
        sa.Column("ephemeris_version", sa.String(), nullable=False, server_default=sa.text("'de440'")),
        sa.Column("processing_time", sa.Integer(), nullable=True),
        sa.Column("cache_hit_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("calculations_session_id_idx", "calculations", ["session_id"])
    op.create_index("calculations_created_at_idx", "calculations", ["created_at"])
    op.create_index("calculations_expires_idx", "calculations", ["expires_at"])
    op.create_index("calculations_session_created_idx", "calculations", ["session_id", "created_at"])

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("user_role", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("resource", sa.String(), nullable=False),
        sa.Column("resource_id", sa.String(), nullable=True),
        sa.Column("old_values", sa.Text(), nullable=True),
        sa.Column("new_values", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("request_id", sa.String(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("audit_logs_user_id_idx", "audit_logs", ["user_id"])
    op.create_index("audit_logs_action_idx", "audit_logs", ["action"])
    op.create_index("audit_logs_resource_idx", "audit_logs", ["resource"])
    op.create_index("audit_logs_user_created_idx", "audit_logs", ["user_id", "created_at"])
    op.create_index("audit_logs_resource_action_idx", "audit_logs", ["resource", "action"])
    op.create_index("audit_logs_created_at_idx", "audit_logs", ["created_at"])

    # --- data_retention ---
    op.create_table(
        "data_retention",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("data_type", sa.String(), nullable=False),
        sa.Column("retention_days", sa.Integer(), nullable=False),
        sa.Column("scheduled_deletion_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actually_deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'scheduled'")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("data_retention_user_id_idx", "data_retention", ["user_id"])
    op.create_index("data_retention_session_id_idx", "data_retention", ["session_id"])
    op.create_index("data_retention_status_idx", "data_retention", ["status"])
    op.create_index("data_retention_scheduled_idx", "data_retention", ["scheduled_deletion_at", "status"])

    # --- artifacts ---
    op.create_table(
        "artifacts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("job_id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("kind", sa.String(), nullable=False, server_default=sa.text("'other'")),
        sa.Column("uri", sa.String(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=True),
        sa.Column("checksum", sa.String(), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("metadata_json", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("artifacts_job_kind_idx", "artifacts", ["job_id", "kind"])
    op.create_index("artifacts_session_id_idx", "artifacts", ["session_id"])

    # --- idempotency_keys ---
    op.create_table(
        "idempotency_keys",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("request_hash", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("job_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "key", name="idempotency_keys_user_key_unique"),
    )
    op.create_index("idempotency_keys_expires_idx", "idempotency_keys", ["expires_at"])
    op.create_index("idempotency_keys_job_id_idx", "idempotency_keys", ["job_id"])
    op.create_index("idempotency_keys_request_hash_idx", "idempotency_keys", ["request_hash"])


def downgrade() -> None:
    op.drop_table("idempotency_keys")
    op.drop_table("artifacts")
    op.drop_table("data_retention")
    op.drop_table("audit_logs")
    op.drop_table("calculations")
    op.drop_table("session_favorites")
    op.drop_table("job_events")
    op.drop_table("job_attempts")
    op.drop_table("jobs")
    op.drop_table("sessions")
    op.drop_table("users")
