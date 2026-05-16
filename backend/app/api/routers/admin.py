"""Admin router — metrics and management endpoints.

Restricted to users with ``role == "admin"`` in production.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user, get_tool_registry
from app.tools.base import ToolRegistry

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _require_admin(user: dict[str, Any]) -> None:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin role required",
        )


@router.get("/metrics/tools")
async def admin_tool_metrics(
    registry: ToolRegistry = Depends(get_tool_registry),
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return registered tool metadata."""
    _require_admin(user)
    return {
        "tool_count": registry.tool_count,
        "tools": registry.list_tools(),
    }


@router.get("/metrics/system")
async def admin_system_metrics(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return basic system metrics."""
    _require_admin(user)
    import os
    import sys

    return {
        "service": "ai-pandit-agentic",
        "python_version": sys.version,
        "app_env": os.environ.get("APP_ENV", "unknown"),
    }
