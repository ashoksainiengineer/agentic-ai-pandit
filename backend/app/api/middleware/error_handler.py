"""Centralised exception handler — maps exceptions to JSON error responses.

Catches domain-specific exceptions (ToolError, LLMProviderError, etc.) and
returns structured JSON with an ``error`` key, a machine-readable ``code``,
and a human-readable ``detail``.
"""

from __future__ import annotations

import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.agents.base import (
    LLMProviderAuthError,
    LLMProviderError,
    LLMProviderRateLimitError,
    LLMProviderTimeoutError,
    LLMTierExhaustedError,
)
from app.tools.base import (
    ToolCircuitOpenError,
    ToolError,
    ToolExecutionError,
    ToolNotFoundError,
)

log = structlog.get_logger()


async def exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler registered via ``app.add_exception_handler``."""
    status_code = 500
    code = "internal_error"
    detail = str(exc) if str(exc) else "An unexpected error occurred"

    if isinstance(exc, StarletteHTTPException):
        status_code = exc.status_code
        code = "http_error"
        detail = exc.detail or str(exc)

    elif isinstance(exc, PermissionError):
        status_code = 401
        code = "unauthorized"
        detail = str(exc) or "Authentication required"

    elif isinstance(exc, ToolNotFoundError):
        status_code = 404
        code = "tool_not_found"
        detail = str(exc)

    elif isinstance(exc, ToolExecutionError):
        status_code = 502
        code = "tool_execution_error"
        detail = str(exc)

    elif isinstance(exc, ToolCircuitOpenError):
        status_code = 503
        code = "tool_circuit_open"
        detail = str(exc)

    elif isinstance(exc, ToolError):
        status_code = 400
        code = "tool_error"
        detail = str(exc)

    elif isinstance(exc, LLMProviderRateLimitError):
        status_code = 429
        code = "llm_rate_limited"
        detail = str(exc)

    elif isinstance(exc, LLMProviderAuthError):
        status_code = 502
        code = "llm_auth_error"
        detail = "LLM provider authentication failed"

    elif isinstance(exc, LLMProviderTimeoutError):
        status_code = 504
        code = "llm_timeout"
        detail = str(exc)

    elif isinstance(exc, LLMTierExhaustedError):
        status_code = 503
        code = "llm_tier_exhausted"
        detail = str(exc)

    elif isinstance(exc, LLMProviderError):
        status_code = 502
        code = "llm_provider_error"
        detail = str(exc)

    if status_code >= 500:
        log.error(
            "server_error",
            path=str(request.url),
            method=request.method,
            code=code,
            error=detail[:500],
            exc_info=True,
        )
    elif status_code >= 400:
        log.warning(
            "client_error",
            path=str(request.url),
            method=request.method,
            status=status_code,
            code=code,
        )

    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "detail": detail}},
    )
