"""Session CRUD router — ported from ai-pandit-app Express routes.

Provides endpoints to create, read, update, delete, clone, and list
rectification sessions.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.operations import (
    CreateSessionInput as DbCreateSessionInput,
)
from app.db.operations import (
    clone_session as db_clone_session,
)
from app.db.operations import (
    create_session as db_create_session,
)
from app.db.operations import (
    delete_session as db_delete_session,
)
from app.db.operations import (
    get_session_by_id as db_get_session,
)
from app.db.operations import (
    list_sessions_for_user as db_list_sessions,
)
from app.db.operations import (
    update_session as db_update_session,
)

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


# ── Request / Response schemas ──────────────────────────────────────


class CreateSessionRequest(BaseModel):
    full_name: str
    date_of_birth: str
    tentative_time: str
    birth_place: str
    latitude: float
    longitude: float
    timezone: str
    gender: str | None = None
    life_events: str | None = None
    spouse_data: str | None = None
    offset_config: str | None = None


class SessionResponse(BaseModel):
    id: str
    full_name: str
    date_of_birth: str
    tentative_time: str
    status: str
    created_at: str
    updated_at: str
    rectified_time: str | None = None
    confidence: str | None = None


# ── Routes ──────────────────────────────────────────────────────────


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> SessionResponse:
    session_id = str(uuid4())
    now = datetime.now(UTC).isoformat()

    db_session = await db_create_session(
        db,
        DbCreateSessionInput(
            user_id=user.get("sub", "unknown"),
            external_id=user.get("sub", "unknown"),
            full_name=body.full_name,
            date_of_birth=body.date_of_birth,
            tentative_time=body.tentative_time,
            birth_place=body.birth_place,
            latitude=body.latitude,
            longitude=body.longitude,
            timezone=body.timezone,
            gender=body.gender,
            life_events=body.life_events,
            spouse_data=body.spouse_data,
            offset_config=body.offset_config,
        ),
    )
    # Override the id with our own
    db_session.id = session_id

    return SessionResponse(
        id=db_session.id,
        full_name=db_session.full_name,
        date_of_birth=db_session.date_of_birth,
        tentative_time=db_session.tentative_time,
        status=db_session.status,
        created_at=now,
        updated_at=now,
    )


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> list[SessionResponse]:
    sessions = await db_list_sessions(
        db, user_id=user.get("sub", "unknown"), limit=limit, offset=offset
    )
    return [
        SessionResponse(
            id=s.id,
            full_name=s.full_name,
            date_of_birth=s.date_of_birth,
            tentative_time=s.tentative_time,
            status=s.status,
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else "",
            rectified_time=s.rectified_time,
            confidence=s.confidence,
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> SessionResponse:
    session = await db_get_session(db, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        id=session.id,
        full_name=session.full_name,
        date_of_birth=session.date_of_birth,
        tentative_time=session.tentative_time,
        status=session.status,
        created_at=session.created_at.isoformat() if session.created_at else "",
        updated_at=session.updated_at.isoformat() if session.updated_at else "",
        rectified_time=session.rectified_time,
        confidence=session.confidence,
    )


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> SessionResponse:
    updated = await db_update_session(
        db,
        session_id,
        full_name=body.full_name,
        date_of_birth=body.date_of_birth,
        tentative_time=body.tentative_time,
        birth_place=body.birth_place,
        latitude=body.latitude,
        longitude=body.longitude,
        timezone=body.timezone,
        gender=body.gender,
        life_events=body.life_events,
        spouse_data=body.spouse_data,
        offset_config=body.offset_config,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        id=updated.id,
        full_name=updated.full_name,
        date_of_birth=updated.date_of_birth,
        tentative_time=updated.tentative_time,
        status=updated.status,
        created_at=updated.created_at.isoformat() if updated.created_at else "",
        updated_at=updated.updated_at.isoformat() if updated.updated_at else "",
    )


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> None:
    deleted = await db_delete_session(db, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/{session_id}/clone", response_model=SessionResponse, status_code=201)
async def clone_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> SessionResponse:
    cloned = await db_clone_session(db, session_id)
    if cloned is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        id=cloned.id,
        full_name=cloned.full_name,
        date_of_birth=cloned.date_of_birth,
        tentative_time=cloned.tentative_time,
        status=cloned.status,
        created_at=cloned.created_at.isoformat() if cloned.created_at else "",
        updated_at=cloned.updated_at.isoformat() if cloned.updated_at else "",
    )
