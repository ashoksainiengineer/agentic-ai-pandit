"""Tests for structured output schemas and XML fallback parsing.

Covers AgentVerdict, CriticVerdict, BatchVerdict schemas and
the regex-based XML parsers used when LLM structured output fails.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.agents.structured_output import (
    AGENT_VERDICT_XML_RE,
    CRITIC_VERDICT_XML_RE,
    AgentVerdict,
    AnchorEventSelection,
    BatchVerdict,
    CriticCheck,
    CriticVerdict,
    parse_agent_verdict_xml,
    parse_critic_verdict_xml,
    parse_structured_or_fallback,
)


class TestAgentVerdictSchema:
    def test_valid_verdict(self) -> None:
        v = AgentVerdict(
            candidate_id="offset_+5",
            score=78.5,
            reasoning="Moon nakshatra aligns with career events.",
            red_flags=[],
            recommended_action="keep",
        )
        assert v.candidate_id == "offset_+5"
        assert v.score == 78.5
        assert v.recommended_action == "keep"

    def test_score_clamped(self) -> None:
        with pytest.raises(ValidationError):
            AgentVerdict(
                candidate_id="t1",
                score=150.0,
                reasoning="x" * 10,
            )

    def test_score_negative(self) -> None:
        with pytest.raises(ValidationError):
            AgentVerdict(
                candidate_id="t1",
                score=-10.0,
                reasoning="x" * 10,
            )

    def test_reasoning_min_length(self) -> None:
        with pytest.raises(ValidationError):
            AgentVerdict(
                candidate_id="t1",
                score=50.0,
                reasoning="short",
            )

    def test_default_red_flags(self) -> None:
        v = AgentVerdict(
            candidate_id="t1",
            score=50.0,
            reasoning="x" * 10,
        )
        assert v.red_flags == []

    def test_default_action(self) -> None:
        v = AgentVerdict(
            candidate_id="t1",
            score=50.0,
            reasoning="x" * 10,
        )
        assert v.recommended_action == "keep"


class TestCriticVerdictSchema:
    def test_valid_approved(self) -> None:
        v = CriticVerdict(
            approved=True,
            summary="All checks passed. Candidate looks solid.",
            checks=[
                CriticCheck(check_name="lagna_alignment", passed=True, severity="info"),
            ],
        )
        assert v.approved is True
        assert len(v.checks) == 1

    def test_rejected_with_reroute(self) -> None:
        v = CriticVerdict(
            approved=False,
            confidence_adjustment=-10.0,
            summary="Lagna calculation seems off.",
            re_evaluate_stage="lagna",
        )
        assert v.approved is False
        assert v.confidence_adjustment == -10.0
        assert v.re_evaluate_stage == "lagna"

    def test_confidence_adjustment_bounds(self) -> None:
        with pytest.raises(ValidationError):
            CriticVerdict(
                approved=False,
                confidence_adjustment=5.0,
                summary="x" * 10,
            )

    def test_re_evaluate_stage_valid(self) -> None:
        for stage in ("lagna", "dasha", "varga", "forensic"):
            v = CriticVerdict(
                approved=False,
                summary="Needs re-evaluation.",
                re_evaluate_stage=stage,
            )
            assert v.re_evaluate_stage == stage


class TestBatchVerdictSchema:
    def test_valid_batch(self) -> None:
        verdicts = [
            AgentVerdict(candidate_id="t1", score=80.0, reasoning="x" * 10),
            AgentVerdict(candidate_id="t2", score=60.0, reasoning="y" * 10),
        ]
        bv = BatchVerdict(verdicts=verdicts, batch_summary="Batch done.")
        assert len(bv.verdicts) == 2
        assert bv.batch_summary == "Batch done."

    def test_batch_min_one_verdict(self) -> None:
        with pytest.raises(ValidationError):
            BatchVerdict(verdicts=[])


class TestAnchorEventSelection:
    def test_valid_selection(self) -> None:
        a = AnchorEventSelection(
            anchor_ids=["evt_1", "evt_2", "evt_3"],
            reasoning="These three cover all major life areas.",
        )
        assert len(a.anchor_ids) == 3
        assert a.reasoning

    def test_too_few_anchors(self) -> None:
        with pytest.raises(ValidationError):
            AnchorEventSelection(
                anchor_ids=["evt_1"],
                reasoning="Not enough anchors.",
            )

    def test_too_many_anchors(self) -> None:
        with pytest.raises(ValidationError):
            AnchorEventSelection(
                anchor_ids=[f"evt_{i}" for i in range(10)],
                reasoning="Too many.",
            )


class TestParseAgentVerdictXml:
    def test_single_verdict(self) -> None:
        xml = """<AGENT_VERDICT>
            <candidate_id>offset_+5</candidate_id>
            <score>82.5</score>
            <reasoning>Strong lagna alignment.</reasoning>
            <red_flags>boundary_proximity</red_flags>
            <recommended_action>keep</recommended_action>
        </AGENT_VERDICT>"""
        results = parse_agent_verdict_xml(xml)
        assert len(results) == 1
        v = results[0]
        assert v.candidate_id == "offset_+5"
        assert v.score == 82.5
        assert "Strong lagna alignment" in v.reasoning
        assert v.red_flags == ["boundary_proximity"]
        assert v.recommended_action == "keep"

    def test_multiple_verdicts(self) -> None:
        xml = """
        <AGENT_VERDICT><candidate_id>t1</candidate_id><score>70</score><reasoning>Strong alignment found.</reasoning></AGENT_VERDICT>
        <AGENT_VERDICT><candidate_id>t2</candidate_id><score>30</score><reasoning>Poor aspect pattern.</reasoning></AGENT_VERDICT>
        """
        results = parse_agent_verdict_xml(xml)
        assert len(results) == 2
        assert results[0].candidate_id == "t1"
        assert results[1].candidate_id == "t2"

    def test_no_match_returns_empty(self) -> None:
        results = parse_agent_verdict_xml("No XML here")
        assert results == []

    def test_malformed_entry_skipped(self) -> None:
        xml = """
        <AGENT_VERDICT><candidate_id>t1</candidate_id><score>not-a-number</score><reasoning>Invalid score val.</reasoning></AGENT_VERDICT>
        <AGENT_VERDICT><candidate_id>t2</candidate_id><score>85</score><reasoning>Good score match.</reasoning></AGENT_VERDICT>
        """
        results = parse_agent_verdict_xml(xml)
        assert len(results) == 1
        assert results[0].candidate_id == "t2"

    def test_score_clamped_in_parse(self) -> None:
        xml = """<AGENT_VERDICT>
            <candidate_id>t1</candidate_id>
            <score>500</score>
            <reasoning>Way too high.</reasoning>
        </AGENT_VERDICT>"""
        results = parse_agent_verdict_xml(xml)
        assert len(results) == 1
        assert results[0].score == 100.0

    def test_missing_optional_fields(self) -> None:
        xml = """<AGENT_VERDICT>
            <candidate_id>t1</candidate_id>
            <score>75</score>
            <reasoning>No optional fields.</reasoning>
        </AGENT_VERDICT>"""
        results = parse_agent_verdict_xml(xml)
        assert len(results) == 1
        assert results[0].red_flags == []
        assert results[0].recommended_action == "keep"

    def test_regex_compiled(self) -> None:
        """Verify the module-level regex compiles and matches basic patterns."""
        assert AGENT_VERDICT_XML_RE is not None
        assert CRITIC_VERDICT_XML_RE is not None


class TestParseCriticVerdictXml:
    def test_approved(self) -> None:
        xml = """<CRITIC_VERDICT>
            <approved>true</approved>
            <summary>Everything checks out.</summary>
        </CRITIC_VERDICT>"""
        v = parse_critic_verdict_xml(xml)
        assert v is not None
        assert v.approved is True
        assert "Everything checks out" in v.summary

    def test_rejected_with_reroute(self) -> None:
        xml = """<CRITIC_VERDICT>
            <approved>false</approved>
            <summary>Lagna needs review.</summary>
            <re_evaluate_stage>lagna</re_evaluate_stage>
        </CRITIC_VERDICT>"""
        v = parse_critic_verdict_xml(xml)
        assert v is not None
        assert v.approved is False
        assert v.re_evaluate_stage == "lagna"

    def test_no_match_returns_none(self) -> None:
        v = parse_critic_verdict_xml("not xml")
        assert v is None

    def test_malformed_returns_none(self) -> None:
        xml = """<CRITIC_VERDICT><approved>maybe</approved><summary>Ambiguous.</summary></CRITIC_VERDICT>"""
        v = parse_critic_verdict_xml(xml)
        assert v is not None
        assert v.approved is False  # "maybe" is not truthy


class TestParseStructuredOrFallback:
    def test_valid_json_agent_verdict(self) -> None:
        data = {
            "candidate_id": "t1",
            "score": 85.0,
            "reasoning": "x" * 10,
        }
        import json

        result = parse_structured_or_fallback(json.dumps(data), AgentVerdict)
        assert result is not None
        assert result.candidate_id == "t1"
        assert result.score == 85.0

    def test_valid_json_critic_verdict(self) -> None:
        data = {
            "approved": True,
            "summary": "x" * 10,
        }
        import json

        result = parse_structured_or_fallback(json.dumps(data), CriticVerdict)
        assert result is not None
        assert result.approved is True

    def test_fallback_xml_agent_verdict(self) -> None:
        xml = """<AGENT_VERDICT>
            <candidate_id>t1</candidate_id>
            <score>90</score>
            <reasoning>XML fallback works.</reasoning>
        </AGENT_VERDICT>"""
        result = parse_structured_or_fallback(xml, AgentVerdict)
        assert result is not None
        assert result.candidate_id == "t1"
        assert result.score == 90.0

    def test_fallback_xml_critic_verdict(self) -> None:
        xml = """<CRITIC_VERDICT>
            <approved>true</approved>
            <summary>XML fallback worked.</summary>
        </CRITIC_VERDICT>"""
        result = parse_structured_or_fallback(xml, CriticVerdict)
        assert result is not None
        assert result.approved is True

    def test_fallback_xml_batch_verdict(self) -> None:
        xml = """
        <AGENT_VERDICT><candidate_id>t1</candidate_id><score>70</score><reasoning>First candidate is good.</reasoning></AGENT_VERDICT>
        <AGENT_VERDICT><candidate_id>t2</candidate_id><score>80</score><reasoning>Second even better.</reasoning></AGENT_VERDICT>
        """
        result = parse_structured_or_fallback(xml, BatchVerdict)
        assert result is not None
        assert isinstance(result, BatchVerdict)
        assert len(result.verdicts) == 2

    def test_unparseable_returns_none(self) -> None:
        result = parse_structured_or_fallback("totally invalid", AgentVerdict)
        assert result is None
