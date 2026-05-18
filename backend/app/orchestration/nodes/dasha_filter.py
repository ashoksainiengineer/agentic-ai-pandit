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
from app.tools.definitions.dasha_tools import (
    VimshottariDashaInput,
    tool_get_vimshottari_dasha,
)

log = structlog.get_logger()
_prompts = PromptManager()
MIN_SCORE = 50


async def dasha_filter_node(state: BTRState) -> dict[str, Any]:
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
        verdict = await _evaluate_dasha_alignment(candidate, anchor_events, tier_router)
        verdicts.append(verdict)
        if verdict.score >= MIN_SCORE:
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
) -> AgentVerdict:
    try:
        dasha_input = VimshottariDashaInput(
            timestamp_utc=candidate.time,
            latitude=0.0,
            longitude=0.0,
            max_levels=3,
        )
        _dasha_result = await tool_get_vimshottari_dasha(dasha_input)
    except Exception as exc:
        log.warning("dasha_tool_failed", candidate=candidate.candidate_key, error=str(exc)[:100])
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=30.0,
            reasoning=f"Dasha tool call failed: {exc}",
            red_flags=["dasha_tool_failure"],
            recommended_action="eliminate",
        )

    user_msg = _build_dasha_user_message(candidate, events)
    try:
        response = await router.generate(
            tier=AITier.CHEAP,
            system_prompt=_prompts.get_prompt("dasha_expert"),
            messages=[{"role": "user", "content": user_msg}],
            structured_output_schema=AgentVerdict,
        )
        return _parse_agent_verdict(response.content, candidate)
    except Exception as exc:
        log.warning("dasha_llm_failed", error=str(exc)[:100])
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=30.0,
            reasoning=f"Dasha LLM evaluation failed: {exc}",
            red_flags=["dasha_llm_failure"],
            recommended_action="eliminate",
        )


def _build_dasha_user_message(candidate: CandidateDataPackage, events: list[LifeEvent]) -> str:
    dasha_lines = "\n".join(
        f"  {d.maha}/{d.antar}: {d.start_end}" for d in (candidate.vimshottari_dasha or [])[:10]
    )
    event_lines = "\n".join(
        f"  [{e.category.value}] {e.event_type} ({e.event_date})" for e in events[:5]
    )
    return (
        f'{{\n'
        f'  "candidate_id": "{candidate.candidate_key or candidate.time}",\n'
        f'  "dasha_entries": [\n'
        f'{dasha_lines}\n'
        f'  ],\n'
        f'  "anchor_events": [\n'
        f'{event_lines}\n'
        f'  ]\n'
        f'}}'
    )


def _parse_agent_verdict(raw_content: str, candidate: CandidateDataPackage) -> AgentVerdict:
    try:
        data = json.loads(raw_content)
        return AgentVerdict.model_validate(data)
    except (json.JSONDecodeError, Exception) as exc:
        log.warning("dasha_verdict_parse_fallback", error=str(exc)[:100])
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
