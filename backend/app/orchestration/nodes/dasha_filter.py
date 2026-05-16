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

MIN_SCORE = 50


async def dasha_filter_node(state: BTRState) -> dict[str, Any]:
    """Evaluate Vimshottari dasha–event alignment for each surviving candidate."""
    candidates: list[CandidateDataPackage] = state.get("candidates", [])
    anchor_events: list[LifeEvent] = state.get("anchor_events", [])

    if not candidates:
        log.warning("dasha_filter_no_candidates")
        return {}

    tier_router = TierRouter()
    surviving: list[CandidateDataPackage] = []
    eliminated: list[CandidateDataPackage] = []
    verdicts: list[AgentVerdict] = []

    for candidate in candidates:
        score = await _evaluate_dasha_alignment(candidate, anchor_events, tier_router)
        verdict = AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=score,
            reasoning=_build_dasha_reasoning(candidate, score),
            red_flags=[] if score >= MIN_SCORE else ["dasha_score_below_threshold"],
            recommended_action="keep" if score >= MIN_SCORE else "eliminate",
        )
        verdicts.append(verdict)
        if score >= MIN_SCORE:
            surviving.append(candidate)
        else:
            eliminated.append(candidate)

    log.info("dasha_filter_complete", total=len(candidates), surviving=len(surviving))

    return {
        "candidates": surviving,
        "eliminated": eliminated,
        "verdicts": verdicts,
        "current_stage": "varga",
        "tool_call_count": state.get("tool_call_count", 0) + len(candidates),
    }


async def _evaluate_dasha_alignment(
    candidate: CandidateDataPackage,
    events: list[LifeEvent],
    router: TierRouter,
) -> float:
    dasha_entries = candidate.vimshottari_dasha
    if not dasha_entries:
        return 30.0

    user_msg = _build_dasha_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.CHEAP,
            system_prompt=_DASHA_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=AgentVerdict,
        )
        return float(response.content) if response.content.replace(".", "", 1).isdigit() else 50.0
    except Exception as exc:
        log.warning("dasha_llm_failed", error=str(exc)[:100])
        return 30.0


def _build_dasha_reasoning(candidate: CandidateDataPackage, score: float) -> str:
    return f"Dasha evaluation for {candidate.candidate_key or candidate.time}: score={score:.1f}"


def _build_dasha_user_message(candidate: CandidateDataPackage, events: list[LifeEvent]) -> str:
    dasha_lines = "\n".join(
        f"  {d.maha}/{d.antar}: {d.start_end}" for d in (candidate.vimshottari_dasha or [])[:10]
    )
    event_lines = "\n".join(
        f"  [{e.category.value}] {e.event_type} ({e.event_date})"
        for e in events[:5]
    )
    return (
        f"Candidate time: {candidate.time}\n"
        f"Vimshottari dasha periods:\n{dasha_lines}\n\n"
        f"Anchor events:\n{event_lines}\n\n"
        "Score the dasha lord–event alignment (0-100)."
    )


_DASHA_SYSTEM_PROMPT = """You are a Vedic Astrology Dasha Expert. Your task is to evaluate whether a candidate's Vimshottari dasha periods align with their life anchor events.

For each candidate:
1. Check if the Mahadasha lord at the time of each event is a significator for that event type.
2. Check if the Antardasha lord refines the event timing.
3. Consider dasha boundary proximity — events near dasha changes are less reliable.
4. Score 0-100, where 0 means no alignment and 100 means perfect alignment.
5. Only keep candidates with score >= 50.

Output your verdict as a score with brief reasoning."""
