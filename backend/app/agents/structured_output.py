"""Pydantic structured output schemas for all BTR agent verdicts.

Every LLM call in the orchestration layer returns one of these
structured outputs, parsed via ``with_structured_output()`` or
fallback XML regex parsing.
"""

from __future__ import annotations

import re
from typing import Any

import structlog
from pydantic import BaseModel, Field

# ──────────────────────────────────────────────────────────────
# AgentVerdict — used by Lagna, Dasha, Varga, Forensic nodes
# ──────────────────────────────────────────────────────────────


class AgentVerdict(BaseModel):
    """Structured output from a filter node agent.

    Each node evaluates one or more candidates and returns verdicts
    with scores and reasoning.
    """

    candidate_id: str = Field(..., description="Candidate time identifier")
    score: float = Field(..., ge=0, le=100, description="Confidence score 0-100")
    reasoning: str = Field(
        ..., min_length=10, description="Astrological reasoning for the score"
    )
    red_flags: list[str] = Field(
        default_factory=list, description="Any concerns or warnings"
    )
    recommended_action: str = Field(
        default="keep",
        description="'keep' | 'eliminate' | 'promote' | 're-evaluate'",
    )


class BatchVerdict(BaseModel):
    """Aggregated verdicts for a batch of candidates."""

    verdicts: list[AgentVerdict] = Field(..., min_length=1, max_length=50)
    batch_summary: str = Field(
        default="", description="High-level summary of the batch analysis"
    )


# ──────────────────────────────────────────────────────────────
# CriticVerdict — used by the Critic node
# ──────────────────────────────────────────────────────────────


class CriticCheck(BaseModel):
    """A single check in the critic's verification checklist."""

    check_name: str = Field(..., description="Name of the verification check")
    passed: bool = Field(..., description="Whether the check passed")
    severity: str = Field(default="info", description="'info' | 'warning' | 'critical'")
    details: str = Field(default="", description="Explanation of the check result")


class CriticVerdict(BaseModel):
    """Structured output from the Critic node."""

    approved: bool = Field(..., description="Whether the finalist is approved")
    confidence_adjustment: float = Field(
        default=0.0,
        ge=-30.0,
        le=0.0,
        description="Negative confidence penalty if issues found",
    )
    checks: list[CriticCheck] = Field(default_factory=list)
    re_evaluate_stage: str | None = Field(
        default=None,
        description="If not approved, which stage to re-evaluate: 'lagna' | 'dasha' | 'varga' | 'forensic'",
    )
    summary: str = Field(..., min_length=10, description="Overall critic assessment")


# ──────────────────────────────────────────────────────────────
# AnchorEventSelection — used by the orchestrator
# ──────────────────────────────────────────────────────────────


class AnchorEventSelection(BaseModel):
    """Top anchor events selected from all life events."""

    anchor_ids: list[str] = Field(..., min_length=3, max_length=5)
    reasoning: str = Field(..., description="Why these were selected as anchors")


# ──────────────────────────────────────────────────────────────
# Fallback XML regex parsing (when structured output fails)
# ──────────────────────────────────────────────────────────────

AGENT_VERDICT_XML_RE = re.compile(
    r"\s*<AGENT_VERDICT>\s*"
    r"<candidate_id>(.+?)</candidate_id>\s*"
    r"<score>(.+?)</score>\s*"
    r"<reasoning>(.+?)</reasoning>\s*"
    r"(?:<red_flags>(.+?)</red_flags>)?\s*"
    r"(?:<recommended_action>(.+?)</recommended_action>)?\s*"
    r"</AGENT_VERDICT>",
    re.DOTALL,
)

CRITIC_VERDICT_XML_RE = re.compile(
    r"\s*<CRITIC_VERDICT>\s*"
    r"<approved>(.+?)</approved>\s*"
    r"<summary>(.+?)</summary>\s*"
    r"(?:<re_evaluate_stage>(.+?)</re_evaluate_stage>)?\s*"
    r"</CRITIC_VERDICT>",
    re.DOTALL,
)


def parse_agent_verdict_xml(text: str) -> list[AgentVerdict]:
    """Fallback: parse ``<AGENT_VERDICT>`` XML blocks from raw LLM output.

    Returns a list of verdicts (one per XML block found).
    """
    verdicts: list[AgentVerdict] = []
    for match in AGENT_VERDICT_XML_RE.finditer(text):
        try:
            score = float(match.group(2).strip())
            red_flags_raw = match.group(4)
            red_flags = (
                [rf.strip() for rf in red_flags_raw.split(",") if rf.strip()]
                if red_flags_raw
                else []
            )
            action = match.group(5).strip() if match.group(5) else "keep"
            verdicts.append(
                AgentVerdict(
                    candidate_id=match.group(1).strip(),
                    score=min(max(score, 0.0), 100.0),
                    reasoning=match.group(3).strip(),
                    red_flags=red_flags,
                    recommended_action=action,
                )
            )
        except (ValueError, IndexError):
            continue
    return verdicts


def parse_critic_verdict_xml(text: str) -> CriticVerdict | None:
    """Fallback: parse ``<CRITIC_VERDICT>`` XML block from raw LLM output."""
    match = CRITIC_VERDICT_XML_RE.search(text)
    if match is None:
        return None
    try:
        approved = match.group(1).strip().lower() in ("true", "yes", "1", "pass")
        return CriticVerdict(
            approved=approved,
            summary=match.group(2).strip(),
            re_evaluate_stage=match.group(3).strip() if match.group(3) else None,
        )
    except (ValueError, IndexError):
        return None


def parse_structured_or_fallback(
    text: str,
    schema: type[BaseModel],
) -> Any:
    """Try to parse *text* as *schema*, falling back to XML regex.

    This is a last-resort parser for when ``with_structured_output()``
    fails and the LLM returns raw text with XML tags instead.
    """
    # If the text is valid JSON matching the schema, parse it
    import json

    try:
        data = json.loads(text)
        return schema.model_validate(data)
    except (json.JSONDecodeError, ValueError):
        logger = structlog.get_logger()
        logger.debug("json_parse_fallback_xml", schema=schema.__name__)

    # Fallback to XML parsing
    if schema is AgentVerdict:
        verdicts = parse_agent_verdict_xml(text)
        return verdicts[0] if verdicts else None
    if schema is CriticVerdict:
        return parse_critic_verdict_xml(text)
    if schema is BatchVerdict:
        verdicts = parse_agent_verdict_xml(text)
        if verdicts:
            return BatchVerdict(
                verdicts=verdicts,
                batch_summary="Parsed from XML fallback.",
            )
    return None
