"""Candidate data router — lazy-load ephemeris data for a time offset.

Ported from the ai-pandit-app Express ``/api/v1/candidate/:sessionId/:time/ephemeris``
route.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_tool_registry
from app.tools.base import ToolRegistry

router = APIRouter(prefix="/api/v1/candidate", tags=["candidate"])


class EphemerisResponse(BaseModel):
    candidate_id: str
    snapshot: dict[str, Any] | None = None
    sign_nakshatra: dict[str, Any] | None = None
    panchanga: dict[str, Any] | None = None
    dasha: dict[str, Any] | None = None


@router.get("/{session_id}/{time}/ephemeris", response_model=EphemerisResponse)
async def get_candidate_ephemeris(
    session_id: str,
    time: str,
    registry: ToolRegistry = Depends(get_tool_registry),
) -> EphemerisResponse:
    """Lazy-load ephemeris data for a candidate birth time.

    Uses the cached ``ToolRegistry`` — repeated calls for the same time
    return the cache hit within 5 minutes.
    """
    from datetime import datetime

    # Validate the timestamp format
    ts: float = 0.0
    try:
        ts = datetime.fromisoformat(time).timestamp()
    except (ValueError, TypeError):
        try:
            ts = float(time)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid time format: '{time}'. Use ISO 8601 or Unix timestamp.",
            ) from None

    try:
        snapshot = await registry.call("get_planetary_snapshot", timestamp=ts)
        snap_data = snapshot.model_dump() if hasattr(snapshot, "model_dump") else {}
        sign_nakshatra = await registry.call(
            "get_sign_and_nakshatra",
            longitude=snap_data.get("ascendant_longitude", 0.0),
        )
        panchanga = await registry.call("get_panchanga", timestamp=ts)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Ephemeris computation failed: {exc}",
        ) from exc

    return EphemerisResponse(
        candidate_id=f"{session_id}:{time}",
        snapshot=snap_data,
        sign_nakshatra=sign_nakshatra.model_dump()
        if hasattr(sign_nakshatra, "model_dump")
        else None,
        panchanga=panchanga.model_dump() if hasattr(panchanga, "model_dump") else None,
    )
