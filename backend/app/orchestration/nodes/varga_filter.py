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
from app.tools.definitions.varga_tools import (
    DivisionalChartsInput,
    tool_get_divisional_charts,
)

log = structlog.get_logger()
_prompts = PromptManager()
MIN_SCORE = 60


async def varga_filter_node(state: BTRState) -> dict[str, Any]:
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
        verdict = await _evaluate_varga(candidate, anchor_events, tier_router)
        verdicts.append(verdict)
        if verdict.score >= MIN_SCORE:
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
) -> AgentVerdict:
    try:
        varga_input = DivisionalChartsInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
        )
        _varga_result = await tool_get_divisional_charts(varga_input)
    except Exception as exc:
        log.warning(
            "varga_tool_failed", candidate=candidate.candidate_key, error=str(exc)[:100]
        )
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=40.0,
            reasoning=f"Varga tool call failed: {exc}",
            red_flags=["varga_tool_failure"],
            recommended_action="eliminate",
        )

    user_msg = _build_varga_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.CHEAP,
            system_prompt=_prompts.get_prompt("varga_expert"),
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=AgentVerdict,
        )
        return _parse_agent_verdict(response.content, candidate)
    except Exception as exc:
        log.warning("varga_llm_failed", error=str(exc)[:100])
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=40.0,
            reasoning=f"Varga LLM evaluation failed: {exc}",
            red_flags=["varga_llm_failure"],
            recommended_action="eliminate",
        )


def _build_varga_user_message(
    candidate: CandidateDataPackage, events: list[LifeEvent]
) -> str:
    d9 = f"D9 Lagna: {candidate.d9_lagna or 'N/A'}"
    d10 = f"D10 Lagna: {candidate.d10_lagna or 'N/A'}"
    d60 = f"D60 sign: {candidate.d60_sign or 'N/A'}"

    career_events = "\n".join(
        f"  {e.event_type} ({e.event_date})"
        for e in events[:5]
        if e.category.value == "career"
    )
    marriage_events = "\n".join(
        f"  {e.event_type} ({e.event_date})"
        for e in events[:5]
        if e.category.value == "marriage"
    )

    return (
        f"{{\n"
        f'  "candidate_id": "{candidate.candidate_key or candidate.time}",\n'
        f'  "{d9}",\n'
        f'  "{d10}",\n'
        f'  "{d60}",\n'
        f'  "career_events": [\n'
        f"{career_events or '  (none)'}\n"
        f"  ],\n"
        f'  "marriage_events": [\n'
        f"{marriage_events or '  (none)'}\n"
        f"  ]\n"
        f"}}"
    )


def _parse_agent_verdict(
    raw_content: str, candidate: CandidateDataPackage
) -> AgentVerdict:
    try:
        data = json.loads(raw_content)
        return AgentVerdict.model_validate(data)
    except (json.JSONDecodeError, Exception) as exc:
        log.warning("varga_verdict_parse_fallback", error=str(exc)[:100])
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
