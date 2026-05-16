from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import TierRouter
from app.agents.structured_output import AgentVerdict
from app.config import AITier
from app.models.btr import CandidateDataPackage
from app.models.events import LifeEvent
from app.orchestration.state import BTRState

log = structlog.get_logger()

MIN_SCORE = 40


async def lagna_filter_node(state: BTRState) -> dict[str, Any]:
    """Evaluate each candidate's Lagna + Moon nakshatra against anchor events.

    For every candidate in ``state["candidates"]``:
      1. Fetch Tool 1 (planetary snapshot) — verify lagna sign & nakshatra.
      2. Fetch Tool 8 (boundary safety) — check if candidate is near a boundary.
      3. Ask the LLM (CHEAP tier) to score lagna–event alignment.
      4. Prune candidates whose score < ``MIN_SCORE``.
    """
    anchor_events: list[LifeEvent] = state.get("anchor_events", [])
    candidates: list[CandidateDataPackage] = state.get("candidates", [])

    if not candidates or not anchor_events:
        log.warning("lagna_filter_skip", candidates=len(candidates), events=len(anchor_events))
        return {}

    tier_router = TierRouter()

    surviving: list[CandidateDataPackage] = []
    eliminated: list[CandidateDataPackage] = []
    verdicts: list[AgentVerdict] = []

    for candidate in candidates:
        score = await _evaluate_candidate_lagna(candidate, anchor_events, tier_router)
        verdict = AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=score,
            reasoning=_build_lagna_reasoning(candidate, score),
            red_flags=[] if score >= MIN_SCORE else ["lagna_score_below_threshold"],
            recommended_action="keep" if score >= MIN_SCORE else "eliminate",
        )
        verdicts.append(verdict)
        if score >= MIN_SCORE:
            surviving.append(candidate)
        else:
            eliminated.append(candidate)

    log.info(
        "lagna_filter_complete",
        total=len(candidates),
        surviving=len(surviving),
    )

    return {
        "candidates": surviving,
        "eliminated": eliminated,
        "verdicts": verdicts,
        "current_stage": "dasha",
        "tool_call_count": state.get("tool_call_count", 0) + len(candidates) * 2,
    }


async def _evaluate_candidate_lagna(
    candidate: CandidateDataPackage,
    events: list[LifeEvent],
    router: TierRouter,
) -> float:
    try:
        from app.tools.definitions.ephemeris_tools import (
            PlanetarySnapshotInput,
            tool_get_planetary_snapshot,
        )
        from app.tools.definitions.varga_tools import (
            BoundarySafetyInput,
            tool_get_boundary_safety,
        )
    except ImportError:
        return 50.0

    try:
        snapshot_input = PlanetarySnapshotInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
        )
        _snapshot = await tool_get_planetary_snapshot(snapshot_input)

        boundary_input = BoundarySafetyInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
        )
        _boundary = await tool_get_boundary_safety(boundary_input)
    except Exception as exc:
        log.warning("lagna_tool_failed", candidate=candidate.candidate_key, error=str(exc)[:100])
        return 30.0

    system_prompt = _LAGNA_SYSTEM_PROMPT

    user_message = _build_lagna_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.CHEAP,
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            structured_output_schema=AgentVerdict,
        )
        return float(response.content) if response.content.replace(".", "", 1).isdigit() else 50.0
    except Exception as exc:
        log.warning("lagna_llm_failed", error=str(exc)[:100])
        return 30.0


def _build_lagna_reasoning(candidate: CandidateDataPackage, score: float) -> str:
    return f"Lagna evaluation for {candidate.candidate_key or candidate.time}: score={score:.1f}"


def _build_lagna_user_message(candidate: CandidateDataPackage, events: list[LifeEvent]) -> str:
    event_summaries = "\n".join(
        f"  - [{e.category.value}] {e.event_type} ({e.event_date}, {e.importance.value})"
        for e in events[:5]
    )
    return (
        f"Candidate time: {candidate.time}\n"
        f"Ascendant: {candidate.ascendant.sign} {candidate.ascendant.degree}\n"
        f"Moon nakshatra: {candidate.moon_nakshatra}\n\n"
        f"Anchor events:\n{event_summaries}\n\n"
        "Score the alignment of Lagna and Moon with each anchor event (0-100)."
    )


_LAGNA_SYSTEM_PROMPT = """You are a Vedic Astrology Lagna Expert. Your task is to evaluate whether a candidate birth time's Lagna (rising sign) and Moon nakshatra align with the provided anchor life events.

For each candidate:
1. Check if the Lagna sign matches the expected house for the event type.
2. Check if the Moon nakshatra lord has any significatorship for the events.
3. Consider boundary proximity — if the Lagna or Moon is near a sign/nakshatra boundary, the score should be lower.
4. Score 0-100, where 0 means impossible and 100 means perfect alignment.
5. Only keep candidates with score >= 40.

Output your verdict as a score with brief reasoning."""
