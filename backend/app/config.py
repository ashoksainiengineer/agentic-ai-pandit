from __future__ import annotations

from enum import StrEnum
from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppEnv(StrEnum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"
    TEST = "test"


class HouseSystem(StrEnum):
    WHOLE_SIGN = "whole_sign"
    EQUAL = "equal"
    PLACIDUS = "placidus"


class JobExecutionMode(StrEnum):
    INLINE = "inline"
    EXTERNAL_WORKER = "external_worker"


class AITier(StrEnum):
    CHEAP = "cheap"
    MID = "mid"
    PREMIUM = "premium"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: AppEnv = AppEnv.DEVELOPMENT
    app_port: int = 8000
    app_host: str = "0.0.0.0"
    app_name: str = "ai-pandit-agentic"
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    neon_database_url: str = Field(default="", min_length=1)

    redis_url: str = Field(default="", min_length=1)
    redis_tls: bool = True
    redis_queue_name: str = "ai-pandit:agentic:jobs"

    clerk_secret_key: str = Field(default="", min_length=1)

    groq_api_key: str = Field(default="", min_length=1)
    groq_model: str = "llama-3.2-90b"
    anthropic_api_key: str = Field(default="", min_length=1)
    anthropic_haiku_model: str = "claude-3-haiku-20240307"
    anthropic_sonnet_model: str = "claude-3-5-sonnet-latest"
    deepseek_api_key: str = Field(default="", min_length=1)
    deepseek_model: str = "deepseek-reasoner"

    vertex_api_key: str = Field(default="", min_length=1)
    vertex_flash_model: str = "gemini-1.5-flash"
    vertex_pro_model: str = "gemini-1.5-pro"

    encryption_secret: str = Field(default="", min_length=32)

    ephemeris_service_url: str = "http://localhost:8001"
    ephemeris_service_timeout_ms: int = 15000
    ephemeris_batch_size: int = 250
    ephemeris_house_system: HouseSystem = HouseSystem.WHOLE_SIGN

    google_cloud_project: str = Field(default="agentic-ai-pandit")
    google_cloud_tasks_queue: str = "btr-jobs"
    google_cloud_storage_bucket: str = "ai-pandit-btr-archive"

    sentry_dsn: str = Field(default="")
    otel_enabled: bool = False
    otel_service_name: str = "ai-pandit-agentic"

    use_async_job_pipeline: bool = True
    job_execution_mode: JobExecutionMode = JobExecutionMode.INLINE

    max_concurrent_sessions: int = 3
    max_active_jobs_per_user: int = 2
    load_shed_queue_depth: int = 80

    @property
    def is_production(self) -> bool:
        return self.app_env == AppEnv.PRODUCTION

    @property
    def is_development(self) -> bool:
        return self.app_env == AppEnv.DEVELOPMENT

    @property
    def is_test(self) -> bool:
        return self.app_env == AppEnv.TEST

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def database_url(self) -> str:
        return self.neon_database_url

    @property
    def ephemeris_service_timeout_s(self) -> float:
        return self.ephemeris_service_timeout_ms / 1000.0


@lru_cache
def get_settings() -> Settings:
    """Lazy singleton — env vars are read on first call, not at import time."""
    return Settings()
