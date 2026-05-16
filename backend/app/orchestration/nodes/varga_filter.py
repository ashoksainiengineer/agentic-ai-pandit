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

MIN_SCORE = 60


async def varga_filter_node(state: BTRState) -> dict[str, Any]:
    """Evaluate divisional chart placements (D9, D10, D60) for each candidate."""
    candidates: list[CandidateDataPackage] = state.get("candidates", [])
    anchor_events: list[LifeEvent] = state.get("anchor_events", [])

    if not candidates:
        log.warning("varga_filter_no_candidates")
        return {}

    tier_router = TierRouter()
    surviving: list[CandidateDataPackage] = []
    eliminated: list[CandidateDataPackage] = []
    verdicts: list[AgentVerdict] = []

    for candidate in candidates:
        score = await _evaluate_varga(candidate, anchor_events, tier_router)
        verdict = AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=score,
            reasoning=_build_varga_reasoning(candidate, score),
            red_flags=[] if score >= MIN_SCORE else ["varga_score_below_threshold"],
            recommended_action="keep" if score >= MIN_SCORE else "eliminate",
        )
        verdicts.append(verdict)
        if score >= MIN_SCORE:
            surviving.append(candidate)
        else:
            eliminated.append(candidate)

    log.info("varga_filter_complete", total=len(candidates), surviving=len(surviving))

    return {
        "candidates": surviving,
        "eliminated": eliminated,
        "verdicts": verdicts,
        "current_stage": "forensic",
        "tool_call_count": state.get("tool_call_count", 0) + len(candidates),
    }


async def _evaluate_varga(
    candidate: CandidateDataPackage,
    events: list[LifeEvent],
    router: TierRouter,
) -> float:
    user_msg = _build_varga_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.CHEAP,
            system_prompt=_VARGA_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=AgentVerdict,
        )
        return float(response.content) if response.content.replace(".", "", 1).isdigit() else 60.0
    except Exception as exc:
        log.warning("varga_llm_failed", error=str(exc)[:100])
        return 40.0


def _build_varga_reasoning(candidate: CandidateDataPackage, score: float) -> str:
    return f"Varga evaluation for {candidate.candidate_key or candidate.time}: score={score:.1f}"


def _build_varga_user_message(candidate: CandidateDataPackage, events: list[LifeEvent]) -> str:
    d9 = f"D9 Lagna: {candidate.d9_lagna or 'N/A'}"
    d10 = f"D10 Lagna: {candidate.d10_lagna or 'N/A'}"
    d60 = f"D60 sign: {candidate.d60_sign or 'N/A'}"

    career_events = "\n".join(
        f"  {e.event_type} ({e.event_date})"
        for e in events[:5] if e.category.value == "career"
    )
    marriage_events = "\n".join(
        f"  {e.event_type} ({e.event_date})"
        for e in events[:5] if e.category.value == "marriage"
    )

    return (
        f"Candidate time: {candidate.time}\n"
        f"{d9}\n{d10}\n{d60}\n\n"
        f"Career events:\n{career_events or '  (none)'}\n"
        f"Marriage events:\n{marriage_events or '  (none)'}\n\n"
        "Score the varga chart–event alignment (0-100)."
    )


_VARGA_SYSTEM_PROMPT = """You are a Vedic Astrology Divisional Chart Expert. Your task is to evaluate candidates using D9 (Navamsha), D10 (Dashamsha), and D60 (Shashtiamsha) charts.

For each candidate:
1. D9 (Navamsha) — Check marriage/relationship alignment. 7th house from D9 Lagna should connect with marriage significators.
2. D10 (Dashamsha) — Check career alignment. 10th house should connect with career significators.
3. D60 (Shashtiamsha) — Check life purpose alignment. D60 reveals karmic trajectory.
4. Score 0-100. Only keep candidates with score >= 60.

Output your verdict as a score with brief reasoning."""
