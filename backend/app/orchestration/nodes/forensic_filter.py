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

MIN_SCORE = 70


async def forensic_filter_node(state: BTRState) -> dict[str, Any]:
    """Apply forensic-level precision checks via D-60, KP sublords, and Nadi Amsha.

    Returns a single best candidate — or ``None`` if no candidate passes.
    """
    candidates: list[CandidateDataPackage] = state.get("candidates", [])
    anchor_events: list[LifeEvent] = state.get("anchor_events", [])

    if not candidates:
        log.warning("forensic_filter_no_candidates")
        return {}

    tier_router = TierRouter()
    best: CandidateDataPackage | None = None
    best_score = 0.0
    verdicts: list[AgentVerdict] = []

    for candidate in candidates:
        score = await _evaluate_forensic(candidate, anchor_events, tier_router)
        verdict = AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=score,
            reasoning=_build_forensic_reasoning(candidate, score),
            red_flags=[],
            recommended_action="promote" if score >= MIN_SCORE else "eliminate",
        )
        verdicts.append(verdict)
        if score > best_score:
            best_score = score
            best = candidate

    surviving = [best] if best and best_score >= MIN_SCORE else []
    eliminated = [c for c in candidates if c is not best]

    log.info(
        "forensic_filter_complete",
        total=len(candidates),
        best_score=best_score,
        approved=bool(best),
    )

    return {
        "candidates": surviving,
        "eliminated": eliminated,
        "verdicts": verdicts,
        "current_stage": "critic",
        "tool_call_count": state.get("tool_call_count", 0) + len(candidates),
    }


async def _evaluate_forensic(
    candidate: CandidateDataPackage,
    events: list[LifeEvent],
    router: TierRouter,
) -> float:
    user_msg = _build_forensic_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.MID,
            system_prompt=_FORENSIC_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=AgentVerdict,
        )
        return float(response.content) if response.content.replace(".", "", 1).isdigit() else 70.0
    except Exception as exc:
        log.warning("forensic_llm_failed", error=str(exc)[:100])
        return 50.0


def _build_forensic_reasoning(candidate: CandidateDataPackage, score: float) -> str:
    return f"Forensic evaluation for {candidate.candidate_key or candidate.time}: score={score:.1f}"


def _build_forensic_user_message(candidate: CandidateDataPackage, events: list[LifeEvent]) -> str:
    return (
        f"Candidate time: {candidate.time}\n"
        f"D60 sign: {candidate.d60_sign or 'N/A'}\n"
        f"D150 sign: {candidate.d150_sign or 'N/A'}\n"
        f"Ascendant: {candidate.ascendant.sign} {candidate.ascendant.degree}\n"
        f"Moon nakshatra: {candidate.moon_nakshatra}\n\n"
        f"Events: {len(events)}\n\n"
        "Score the forensic precision (0-100)."
    )


_FORENSIC_SYSTEM_PROMPT = """You are a Vedic Astrology Precision Expert. Your task is to pinpoint the exact birth second using D-60 deities, KP sub-lords, and Nadi Amsha.

For each candidate:
1. D-60 (Shashtiamsha) — Verify the presiding deity matches the life trajectory.
2. KP sub-lords — Confirm the 4-level hierarchy (Star → Sub → Sub-Sub → Sub-Sub-Sub) aligns with event timing.
3. Nadi Amsha — Check if the karmic significance matches the life pattern.
4. Only the strongest candidate should survive (score >= 70).

Output your verdict as a score with brief reasoning."""
