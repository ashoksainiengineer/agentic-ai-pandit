import os
from unittest.mock import patch

import pytest

from app.config import AppEnv, HouseSystem, JobExecutionMode, Settings

_MINIMAL_ENV: dict[str, str] = {
    "NEON_DATABASE_URL": "postgresql://user:pass@localhost/test",
    "REDIS_URL": "rediss://default:pass@localhost:6379",
    "CLERK_SECRET_KEY": "sk_test_clerk_key_here",
    "GROQ_API_KEY": "gsk_test_groq_key",
    "ANTHROPIC_API_KEY": "sk-ant-test-key",
    "DEEPSEEK_API_KEY": "sk_test_deepseek",
    "ENCRYPTION_SECRET": "a" * 32,
    "GOOGLE_CLOUD_PROJECT": "test-project",
    "SENTRY_DSN": "",
}


def test_settings_defaults_with_env_vars() -> None:
    env = _MINIMAL_ENV | {"APP_ENV": "development"}
    with patch.dict(os.environ, env, clear=True):
        s = Settings()
        assert s.app_env == AppEnv.DEVELOPMENT
        assert s.app_port == 8000
        assert s.is_development is True
        assert s.is_production is False
        assert s.database_url == "postgresql://user:pass@localhost/test"


def test_settings_production_detection() -> None:
    env = _MINIMAL_ENV | {"APP_ENV": "production"}
    with patch.dict(os.environ, env, clear=True):
        s = Settings()
        assert s.is_production is True
        assert s.is_development is False


def test_settings_origins_list() -> None:
    env = _MINIMAL_ENV | {
        "ALLOWED_ORIGINS": "https://app.example.com,https://api.example.com"
    }
    with patch.dict(os.environ, env, clear=True):
        s = Settings()
        assert s.origins_list == [
            "https://app.example.com",
            "https://api.example.com",
        ]


def test_settings_enum_defaults() -> None:
    with patch.dict(os.environ, _MINIMAL_ENV, clear=True):
        s = Settings()
        assert s.ephemeris_house_system == HouseSystem.WHOLE_SIGN
        assert s.job_execution_mode == JobExecutionMode.INLINE
        assert s.use_async_job_pipeline is True


@pytest.mark.parametrize(
    "env_value,expected",
    [
        ("true", True),
        ("True", True),
        ("1", True),
        ("false", False),
        ("False", False),
        ("0", False),
    ],
)
def test_settings_bool_parsing(env_value: str, expected: bool) -> None:
    env = _MINIMAL_ENV | {"USE_ASYNC_JOB_PIPELINE": env_value, "OTEL_ENABLED": "false"}
    with patch.dict(os.environ, env, clear=True):
        s = Settings()
        assert s.use_async_job_pipeline is expected


def test_settings_missing_required_field_raises() -> None:
    with patch.dict(os.environ, {}, clear=True), pytest.raises(ValueError):
        Settings()
