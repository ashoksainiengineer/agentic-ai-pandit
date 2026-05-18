from __future__ import annotations

import json
from typing import Any

import structlog

from app.agents.base import TierRouter
from app.agents.prompt_manager import PromptManager
from app.agents.structured_output import AgentVerdict
from app.config import AITier
from app.models.btr import CandidateDataPackage
from app.models.events import LifeEvent
from app.orchestration.state import BTRState
from app.tools.definitions.forensic_tools import (
    GandantaInput,
    NadiAmshaInput,
    tool_get_gandanta_analysis,
    tool_get_nadi_amsha_d150,
)
from app.tools.definitions.strength_tools import (
    KpSublordsInput,
    tool_get_kp_sublords,
)

log = structlog.get_logger()
_prompts = PromptManager()
MIN_SCORE = 70


async def forensic_filter_node(state: BTRState) -> dict[str, Any]:
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
        verdict = await _evaluate_forensic(candidate, anchor_events, tier_router)
        verdicts.append(verdict)
        if verdict.score > best_score:
            best_score = verdict.score
            best = candidate

    surviving = [best] if best and best_score >= MIN_SCORE else []
    eliminated = [c for c in candidates if c is not best]

    log.info("forensic_filter_complete", total=len(candidates), best_score=best_score, approved=bool(best))

    return {
        "candidates": surviving,
        "eliminated": eliminated,
        "verdicts": verdicts,
        "current_stage": "critic",
        "tool_call_count": state.get("tool_call_count", 0) + len(candidates) * 3,
    }


async def _evaluate_forensic(
    candidate: CandidateDataPackage,
    events: list[LifeEvent],
    router: TierRouter,
) -> AgentVerdict:
    try:
        gandanta_input = GandantaInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
        )
        _gandanta = await tool_get_gandanta_analysis(gandanta_input)

        nadi_input = NadiAmshaInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
        )
        _nadi = await tool_get_nadi_amsha_d150(nadi_input)

        kp_input = KpSublordsInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
        )
        _kp = await tool_get_kp_sublords(kp_input)
    except Exception as exc:
        log.warning("forensic_tool_failed", candidate=candidate.candidate_key, error=str(exc)[:100])
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=50.0,
            reasoning=f"Forensic tool call failed: {exc}",
            red_flags=["forensic_tool_failure"],
            recommended_action="eliminate",
        )

    user_msg = _build_forensic_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.MID,
            system_prompt=_prompts.get_prompt("forensic_expert"),
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=AgentVerdict,
        )
        return _parse_agent_verdict(response.content, candidate)
    except Exception as exc:
        log.warning("forensic_llm_failed", error=str(exc)[:100])
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=50.0,
            reasoning=f"Forensic LLM evaluation failed: {exc}",
            red_flags=["forensic_llm_failure"],
            recommended_action="eliminate",
        )


def _build_forensic_user_message(candidate: CandidateDataPackage, events: list[LifeEvent]) -> str:
    return (
        f'{{\n'
        f'  "candidate_id": "{candidate.candidate_key or candidate.time}",\n'
        f'  "d60_sign": "{candidate.d60_sign or "N/A"}",\n'
        f'  "d150_sign": "{candidate.d150_sign or "N/A"}",\n'
        f'  "ascendant": "{candidate.ascendant.sign if candidate.ascendant else "N/A"} {candidate.ascendant.degree if candidate.ascendant else "N/A"}",\n'
        f'  "moon_nakshatra": "{candidate.moon_nakshatra or "N/A"}",\n'
        f'  "event_count": {len(events)}\n'
        f'}}'
    )


def _parse_agent_verdict(raw_content: str, candidate: CandidateDataPackage) -> AgentVerdict:
    try:
        data = json.loads(raw_content)
        return AgentVerdict.model_validate(data)
    except (json.JSONDecodeError, Exception) as exc:
        log.warning("forensic_verdict_parse_fallback", error=str(exc)[:100])
        from app.agents.structured_output import parse_agent_verdict_xml
        verdicts = parse_agent_verdict_xml(raw_content)
        if verdicts:
            return verdicts[0]
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=50.0,
            reasoning="Failed to parse structured output; using default score.",
            red_flags=["parse_failure"],
            recommended_action="re-evaluate",
        )
