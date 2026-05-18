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
from app.tools.definitions.ephemeris_tools import (
    PlanetarySnapshotInput,
    tool_get_planetary_snapshot,
)
from app.tools.definitions.varga_tools import (
    BoundarySafetyInput,
    tool_get_boundary_safety,
)

log = structlog.get_logger()
_prompts = PromptManager()
MIN_SCORE = 40


async def lagna_filter_node(state: BTRState) -> dict[str, Any]:
    anchor_events: list[LifeEvent] = state.get("anchor_events", [])
    candidates: list[CandidateDataPackage] = state.get("candidates", [])

    if not candidates or not anchor_events:
        log.warning(
            "lagna_filter_skip", candidates=len(candidates), events=len(anchor_events)
        )
        return {}

    tier_router = TierRouter()

    surviving: list[CandidateDataPackage] = []
    eliminated: list[CandidateDataPackage] = []
    verdicts: list[AgentVerdict] = []

    for candidate in candidates:
        verdict = await _evaluate_candidate_lagna(candidate, anchor_events, tier_router)
        verdicts.append(verdict)
        if verdict.score >= MIN_SCORE:
            surviving.append(candidate)
        else:
            eliminated.append(candidate)

    log.info("lagna_filter_complete", total=len(candidates), surviving=len(surviving))

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
) -> AgentVerdict:
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
        log.warning(
            "lagna_tool_failed", candidate=candidate.candidate_key, error=str(exc)[:100]
        )
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=30.0,
            reasoning=f"Tool call failed: {exc}",
            red_flags=["lagna_tool_failure"],
            recommended_action="eliminate",
        )

    system_prompt = _prompts.get_prompt("lagna_expert")
    user_message = _build_lagna_user_message(candidate, events)

    try:
        response = await router.generate(
            tier=AITier.CHEAP,
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            structured_output_schema=AgentVerdict,
        )
        return _parse_agent_verdict(response.content, candidate)
    except Exception as exc:
        log.warning("lagna_llm_failed", error=str(exc)[:100])
        return AgentVerdict(
            candidate_id=candidate.candidate_key or candidate.time,
            score=30.0,
            reasoning=f"LLM evaluation failed: {exc}",
            red_flags=["lagna_llm_failure"],
            recommended_action="eliminate",
        )


def _parse_agent_verdict(
    raw_content: str, candidate: CandidateDataPackage
) -> AgentVerdict:
    try:
        data = json.loads(raw_content)
        return AgentVerdict.model_validate(data)
    except (json.JSONDecodeError, Exception) as exc:
        log.warning(
            "verdict_parse_fallback",
            error=str(exc)[:100],
            content_preview=raw_content[:200],
        )
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


def _build_lagna_user_message(
    candidate: CandidateDataPackage, events: list[LifeEvent]
) -> str:
    event_summaries = "\n".join(
        f"  - [{e.category.value}] {e.event_type} ({e.event_date}, {e.importance.value})"
        for e in events[:5]
    )
    return (
        f"{{\n"
        f'  "candidate_id": "{candidate.candidate_key or candidate.time}",\n'
        f'  "lagna_sign": "{candidate.ascendant.sign if candidate.ascendant else "N/A"}",\n'
        f'  "moon_nakshatra": "{candidate.moon_nakshatra or "N/A"}",\n'
        f'  "anchor_events": [\n'
        f"{event_summaries}\n"
        f"  ]\n"
        f"}}"
    )
