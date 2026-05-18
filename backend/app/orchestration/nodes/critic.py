from __future__ import annotations

import json
from typing import Any

import structlog

from app.agents.base import TierRouter
from app.agents.prompt_manager import PromptManager
from app.agents.structured_output import CriticVerdict
from app.config import AITier
from app.models.btr import CandidateDataPackage
from app.models.events import LifeEvent
from app.orchestration.state import BTRState
from app.tools.definitions.ephemeris_tools import (
    PlanetarySnapshotInput,
    tool_get_planetary_snapshot,
)
from app.tools.definitions.forensic_tools import (
    GandantaInput,
    SpouseD9VerificationInput,
    tool_get_gandanta_analysis,
    tool_get_spouse_d9_verification,
)

log = structlog.get_logger()
_prompts = PromptManager()
MAX_ITERATIONS = 3


async def critic_node(state: BTRState) -> dict[str, Any]:
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

    try:
        snapshot_input = PlanetarySnapshotInput(
            timestamp_utc=finalist.time,
            latitude=0.0,
            longitude=0.0,
        )
        _snapshot = await tool_get_planetary_snapshot(snapshot_input)

        gandanta_input = GandantaInput(
            timestamp_utc=finalist.time,
            latitude=0.0,
            longitude=0.0,
        )
        _gandanta = await tool_get_gandanta_analysis(gandanta_input)

        spouse_input = SpouseD9VerificationInput(
            native_timestamp_utc=finalist.time,
            native_latitude=0.0,
            native_longitude=0.0,
            spouse_timestamp_utc=finalist.time,
            spouse_latitude=0.0,
            spouse_longitude=0.0,
        )
        _spouse = await tool_get_spouse_d9_verification(spouse_input)
    except Exception as exc:
        log.warning(
            "critic_tool_failed", candidate=finalist.candidate_key, error=str(exc)[:100]
        )

    user_msg = _build_critic_user_message(finalist, anchor_events, critic_iterations)

    try:
        response = await tier_router.generate(
            tier=AITier.PREMIUM,
            system_prompt=_prompts.get_prompt("critic"),
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=CriticVerdict,
        )
        critic_verdict = _parse_critic_verdict(response.content)
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
        adjusted = max(
            0.0, base_confidence + (critic_verdict.confidence_adjustment or 0.0)
        )
        return {
            "critic_verdict": critic_verdict,
            "critic_iterations": critic_iterations + 1,
            "final_rectified_time": finalist.time,
            "confidence": round(adjusted, 1),
            "current_stage": "complete",
            "tool_call_count": state.get("tool_call_count", 0) + 1,
        }

    re_evaluate = critic_verdict.re_evaluate_stage or "forensic"
    log.info("critic_re_evaluate", stage=re_evaluate, iteration=critic_iterations + 1)

    return {
        "critic_verdict": critic_verdict,
        "critic_iterations": critic_iterations + 1,
        "current_stage": re_evaluate,
        "tool_call_count": state.get("tool_call_count", 0) + 1,
    }


def _parse_critic_verdict(raw_content: str) -> CriticVerdict:
    try:
        data = json.loads(raw_content)
        return CriticVerdict.model_validate(data)
    except (json.JSONDecodeError, Exception) as exc:
        log.warning("critic_verdict_parse_fallback", error=str(exc)[:100])
        from app.agents.structured_output import parse_critic_verdict_xml

        verdict = parse_critic_verdict_xml(raw_content)
        if verdict:
            return verdict
        return CriticVerdict(
            approved=True,
            confidence_adjustment=-10.0,
            checks=[],
            summary="Failed to parse critic output; approving with penalty.",
        )


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
        f"{{\n"
        f'  "candidate_id": "{candidate.candidate_key or candidate.time}",\n'
        f'  "rectified_time": "{candidate.time}",\n'
        f'  "ascendant": "{candidate.ascendant.sign if candidate.ascendant else "N/A"} {candidate.ascendant.degree if candidate.ascendant else "N/A"}",\n'
        f'  "moon_nakshatra": "{candidate.moon_nakshatra or "N/A"}",\n'
        f'  "d9_lagna": "{candidate.d9_lagna or "N/A"}",\n'
        f'  "d60_sign": "{candidate.d60_sign or "N/A"}",\n'
        f'  "confidence": {candidate.ai_score or "N/A"},\n'
        f'  "anchor_events": [\n'
        f"{event_details}\n"
        f"  ]\n"
        f"}}"
    )

    if iteration > 0:
        verifiable_data = (
            verifiable_data.rstrip("}")
            + f',\n  "critic_iteration": {iteration + 1}/{MAX_ITERATIONS}\n}}'
        )

    return verifiable_data
