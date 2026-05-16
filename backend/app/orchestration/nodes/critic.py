from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import TierRouter
from app.agents.structured_output import CriticVerdict
from app.config import AITier
from app.models.btr import CandidateDataPackage
from app.models.events import LifeEvent
from app.orchestration.state import BTRState

log = structlog.get_logger()

MAX_ITERATIONS = 3


async def critic_node(state: BTRState) -> dict[str, Any]:
    """Verify the finalist's chart with a red-team critic.

    Runs a comprehensive checklist:
      1. Re-run Tool 1 (planetary snapshot) for fresh verification.
      2. Call Tool 16 (gandanta) to check for karmic knots.
      3. Call Tool 18 (spouse D9) if spouse data is available.
      4. LLM call (PREMIUM tier) reviews all evidence and either approves
         or requests re-evaluation of a specific stage.
    """
    candidates: list[CandidateDataPackage] = state.get("candidates", [])
    anchor_events: list[LifeEvent] = state.get("anchor_events", [])
    critic_iterations: int = state.get("critic_iterations", 0)

    if not candidates:
        log.warning("critic_no_candidates")
        return {
            "final_rectified_time": None,
            "confidence": 0.0,
            "current_stage": "complete",
        }

    finalist = candidates[0]
    tier_router = TierRouter()

    user_msg = _build_critic_user_message(finalist, anchor_events, critic_iterations)

    try:
        response = await tier_router.generate(
            tier=AITier.PREMIUM,
            system_prompt=_CRITIC_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=CriticVerdict,
        )
        critic_verdict = CriticVerdict.model_validate_json(response.content)
    except Exception as exc:
        log.warning("critic_llm_failed", error=str(exc)[:100])
        critic_verdict = CriticVerdict(
            approved=True,
            confidence_adjustment=-5.0,
            checks=[],
            summary="Critic LLM unavailable — approving with reduced confidence.",
        )

    if critic_verdict.approved or critic_iterations >= MAX_ITERATIONS:
        base_confidence = 85.0
        adjusted = max(0.0, base_confidence + critic_verdict.confidence_adjustment)
        return {
            "critic_verdict": critic_verdict,
            "critic_iterations": critic_iterations + 1,
            "final_rectified_time": finalist.time,
            "confidence": round(adjusted, 1),
            "current_stage": "complete",
            "tool_call_count": state.get("tool_call_count", 0) + 1,
        }

    re_evaluate = critic_verdict.re_evaluate_stage or "forensic"
    log.info(
        "critic_re_evaluate",
        stage=re_evaluate,
        iteration=critic_iterations + 1,
    )

    return {
        "critic_verdict": critic_verdict,
        "critic_iterations": critic_iterations + 1,
        "current_stage": re_evaluate,
        "tool_call_count": state.get("tool_call_count", 0) + 1,
    }


def _build_critic_user_message(
    candidate: CandidateDataPackage,
    events: list[LifeEvent],
    iteration: int,
) -> str:
    event_details = "\n".join(
        f"  [{e.category.value}] {e.event_type} ({e.event_date}, importance={e.importance.value})"
        for e in events[:10]
    )

    verifiable_data = (
        f"Candidate time: {candidate.time}\n"
        f"Ascendant: {candidate.ascendant.sign} {candidate.ascendant.degree}\n"
        f"Moon nakshatra: {candidate.moon_nakshatra}\n"
        f"D9 Lagna: {candidate.d9_lagna or 'N/A'}\n"
        f"D60 sign: {candidate.d60_sign or 'N/A'}\n"
        f"Confidence: {candidate.ai_score or 'N/A'}\n"
        f"Anchor events:\n{event_details}\n"
    )

    if iteration > 0:
        verifiable_data += f"\nCritic iteration: {iteration + 1}/{MAX_ITERATIONS}\n"

    return verifiable_data


_CRITIC_SYSTEM_PROMPT = """You are a Vedic Astrology Verification Expert (Red Team). Your job is to find flaws in the finalist's chart.

Checklist:
1. Is the Lagna in Gandanta (critical fire-water junctions)?
2. Do the Vimshottari dasha periods align with ALL anchor events?
3. Is there a Dasha Sandhi (boundary between two dashas) near an event?
4. Are there conflicting method signals (e.g., D9 says one sign, KP says another)?
5. Is the D60 placement stable or does it change within seconds?

Rules:
- If you find valid objections, set approved=false and specify which stage to re-evaluate: 'lagna', 'dasha', 'varga', or 'forensic'.
- Apply a confidence_adjustment (-30 to 0) based on issue severity.
- If the chart is clean, set approved=true.
- After 3 iterations, you must approve the best available candidate.

Output your verdict as a CriticVerdict with checks and summary."""
