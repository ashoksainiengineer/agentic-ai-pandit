"""LangGraph workflow compiler for the BTR rectification pipeline.

Builds a ``StateGraph`` of 6 nodes::

    START -> lagna -> dasha -> varga -> forensic -> critic
                                                     |
                     ────────────────────────────────┘
                     ▼ (conditional)
               complete (END)

The critic can route back to ``forensic``, ``varga``, ``dasha``, or ``lagna``
up to ``MAX_CRITIC_ITERATIONS`` times before forcing approval.
"""

from __future__ import annotations

from typing import Any

import structlog
from langgraph.graph import END, StateGraph

from app.orchestration.nodes import (
    critic_node,
    dasha_filter_node,
    forensic_filter_node,
    lagna_filter_node,
    varga_filter_node,
)
from app.orchestration.state import BTRState

log = structlog.get_logger()

MAX_CRITIC_ITERATIONS = 3

_STAGE_LAGNA = "lagna"
_STAGE_DASHA = "dasha"
_STAGE_VARGA = "varga"
_STAGE_FORENSIC = "forensic"
_STAGE_CRITIC = "critic"
_STAGE_COMPLETE = "complete"

_STAGE_LITERALS = {
    _STAGE_LAGNA,
    _STAGE_DASHA,
    _STAGE_VARGA,
    _STAGE_FORENSIC,
    _STAGE_CRITIC,
    _STAGE_COMPLETE,
}


def _route_by_stage(state: BTRState) -> str:
    stage = state.get("current_stage", _STAGE_LAGNA)
    if stage in _STAGE_LITERALS:
        return stage
    return _STAGE_COMPLETE


def _critic_router(state: BTRState) -> str:
    current_stage = state.get("current_stage", _STAGE_COMPLETE)
    if current_stage == _STAGE_COMPLETE:
        return END

    critic_iterations = state.get("critic_iterations", 0)
    critic_verdict = state.get("critic_verdict")

    if critic_verdict and not critic_verdict.approved and critic_iterations < MAX_CRITIC_ITERATIONS:
        re_evaluate = critic_verdict.re_evaluate_stage
        if re_evaluate in {_STAGE_LAGNA, _STAGE_DASHA, _STAGE_VARGA, _STAGE_FORENSIC}:
            log.info("critic_reroute", stage=re_evaluate, iteration=critic_iterations)
            return re_evaluate

    return END


def compile_btr_graph(
    checkpointer: Any = None,
    recursion_limit: int = 100,
) -> Any:
    """Build and compile the BTR LangGraph.

    Returns a compiled graph object ready for ``ainvoke()``.
    """
    builder: StateGraph[Any] = StateGraph(BTRState)

    builder.add_node(_STAGE_LAGNA, lagna_filter_node)
    builder.add_node(_STAGE_DASHA, dasha_filter_node)
    builder.add_node(_STAGE_VARGA, varga_filter_node)
    builder.add_node(_STAGE_FORENSIC, forensic_filter_node)
    builder.add_node(_STAGE_CRITIC, critic_node)

    builder.set_entry_point(_STAGE_LAGNA)
    builder.add_conditional_edges(
        _STAGE_LAGNA,
        _route_by_stage,
        {_STAGE_DASHA: _STAGE_DASHA, _STAGE_COMPLETE: END},
    )
    builder.add_conditional_edges(
        _STAGE_DASHA,
        _route_by_stage,
        {_STAGE_VARGA: _STAGE_VARGA, _STAGE_COMPLETE: END},
    )
    builder.add_conditional_edges(
        _STAGE_VARGA,
        _route_by_stage,
        {_STAGE_FORENSIC: _STAGE_FORENSIC, _STAGE_COMPLETE: END},
    )
    builder.add_conditional_edges(
        _STAGE_FORENSIC,
        _route_by_stage,
        {_STAGE_CRITIC: _STAGE_CRITIC, _STAGE_COMPLETE: END},
    )
    builder.add_conditional_edges(
        _STAGE_CRITIC,
        _critic_router,
        {
            _STAGE_LAGNA: _STAGE_LAGNA,
            _STAGE_DASHA: _STAGE_DASHA,
            _STAGE_VARGA: _STAGE_VARGA,
            _STAGE_FORENSIC: _STAGE_FORENSIC,
            END: END,
        },
    )

    graph = builder.compile(
        checkpointer=checkpointer,
        interrupt_after=None,
    )

    log.info(
        "btr_graph_compiled",
        nodes=["lagna", "dasha", "varga", "forensic", "critic"],
        checkpointer=bool(checkpointer),
        recursion_limit=recursion_limit,
    )

    return graph


__all__ = ["compile_btr_graph"]
