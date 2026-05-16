"""BTRState — the single LangGraph TypedDict driving the entire workflow.

All filter nodes read from and write to this state.  The graph compiler
uses ``Annotated`` channels (``operator.add``, ``add_messages``) to let
multiple nodes safely append to shared accumulators.
"""

from __future__ import annotations

import operator
from typing import Annotated, Any

from langgraph.graph import add_messages
from langgraph.managed.is_last_step import RemainingSteps
from typing_extensions import TypedDict

from app.agents.structured_output import AgentVerdict, CriticVerdict
from app.models.btr import CandidateDataPackage
from app.models.events import BirthData, LifeEvent

# ── public symbols re-exported for convenience ─────────────────
__all__ = [
    "BTRState",
    "StageName",
]


StageName = str
"""One of ``"lagna"``, ``"dasha"``, ``"varga"``, ``"forensic"``, ``"critic"``, ``"complete"``."""


class BTRState(TypedDict, total=False):
    """The complete workflow state for a BTR rectification session.

    Every key is optional so that the initial state can be sparse;
    nodes progressively fill in the channels they own.
    """

    # ── input (set once by the entrypoint) ────────────────────
    birth_data: BirthData
    """Original birth details submitted by the user."""

    anchor_events: list[LifeEvent]
    """3-5 anchor life events selected for the rectification."""

    # ── candidate management (accumulated via ``operator.add``) ──
    candidates: Annotated[list[CandidateDataPackage], operator.add]
    """Active candidates flowing through the pipeline.
    Each node reads this list and replaces it with a pruned version.
    """

    eliminated: Annotated[list[CandidateDataPackage], operator.add]
    """Candidates that were pruned by any filter node (audit trail)."""

    # ── scoring  ──────────────────────────────────────────────
    verdicts: Annotated[list[AgentVerdict], operator.add]
    """Every verdict emitted by filter nodes."""

    scores: dict[str, float]
    """Per-candidate scores aggregated across stages."""

    # ── critic  ───────────────────────────────────────────────
    critic_verdict: CriticVerdict
    """The critic's final assessment."""

    critic_iterations: int
    """How many times the critic has evaluated the finalist (0-3)."""

    # ── result  ───────────────────────────────────────────────
    final_rectified_time: str | None
    """The rectified UTC timestamp selected by the pipeline."""

    confidence: float | None
    """Overall confidence percentage (0-100)."""

    # ── stage routing  ─────────────────────────────────────────
    current_stage: StageName
    """Which stage the workflow is currently in."""

    remaining_steps: RemainingSteps
    """Managed by LangGraph — used for recursion-limit checks."""

    # ── observability  ───────────────────────────────────────
    messages: Annotated[list[Any], add_messages]
    """Accumulated LLM conversation messages for traceability."""

    tool_call_count: int
    """Total tool invocations across the session."""

    token_usage: dict[str, Any]
    """Per-stage token usage statistics (serialised ``TokenUsage`` dicts)."""

    stage_log: Annotated[list[dict[str, Any]], operator.add]
    """Chronological log entries for each completed stage."""
