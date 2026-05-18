from __future__ import annotations

from pathlib import Path

import jinja2
import structlog

log = structlog.get_logger()

_PROMPTS_DIR = Path(__file__).parents[2] / "prompts"


class PromptManager:
    """Loads and renders agent system prompts from versioned Markdown files."""

    def __init__(self, version: str = "v1", prompts_dir: Path | None = None) -> None:
        self._version = version
        self._dir = prompts_dir or _PROMPTS_DIR / version
        self._cache: dict[str, str] = {}
        self._env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(self._dir)),
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def get_prompt(self, name: str, **variables: object) -> str:
        """Return the rendered prompt *name* with *variables* substituted."""
        cache_key = f"{name}:{hash(tuple(sorted(variables.items())))}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        template_path = self._dir / f"{name}.md"
        if not template_path.exists():
            log.warning("prompt_not_found", name=name, path=str(template_path))
            return _FALLBACK_PROMPTS.get(name, f"You are a Vedic astrology {name}.")

        source = template_path.read_text(encoding="utf-8")
        rendered = jinja2.Template(source).render(**variables) if variables else source

        self._cache[cache_key] = rendered
        return rendered

    def list_prompts(self) -> list[str]:
        """Return all available prompt names (without ``.md`` extension)."""
        return sorted(p.stem for p in self._dir.glob("*.md") if p.is_file())


_FALLBACK_PROMPTS: dict[str, str] = {
    "lagna_expert": """You are a Vedic Astrology Lagna Expert.
Evaluate whether a candidate birth time's Lagna and Moon nakshatra align with anchor life events.
Score 0-100. Keep candidates with score >= 40.
Respond with valid JSON matching AgentVerdict schema.""",
    "dasha_expert": """You are a Vedic Astrology Dasha Expert.
Evaluate Vimshottari Dasha alignment with life events.
Score 0-100. Keep candidates with score >= 50.
Respond with valid JSON matching AgentVerdict schema.""",
    "varga_expert": """You are a Vedic Astrology Divisional Chart Expert.
Evaluate D9, D10, D60 chart placements against life events.
Score 0-100. Keep candidates with score >= 60.
Respond with valid JSON matching AgentVerdict schema.""",
    "forensic_expert": """You are a Vedic Astrology Precision Expert.
Pinpoint exact birth second using D-60 deities, KP sub-lords, Nadi Amsha.
Score 0-100. Promote strongest candidate (score >= 70).
Respond with valid JSON matching AgentVerdict schema.""",
    "critic": """You are a Vedic Astrology Verification Expert (Red Team).
Find flaws in the finalist's chart. Check against all evidence.
If objections valid, specify re_evaluate_stage. If clean, approve.
Respond with valid JSON matching CriticVerdict schema.""",
}

__all__ = ["PromptManager"]
