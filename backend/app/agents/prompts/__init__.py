"""PromptManager — loads and renders Jinja2-templated agent prompts.

Prompts live as Markdown files in ``app/agents/prompts/`` with embedded
Jinja2 ``{{ variable }}`` syntax for dynamic substitution.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import structlog
from jinja2 import BaseLoader, Environment, FileSystemLoader, TemplateNotFound

log = structlog.get_logger()

_PROMPT_DIR = Path(__file__).resolve().parent
_PROMPT_FILES: dict[str, str] = {
    "lagna": "lagna_expert.md",
    "dasha": "dasha_expert.md",
    "varga": "varga_expert.md",
    "forensic": "forensic_expert.md",
    "critic": "critic.md",
}

_env: Environment | None = None


def _get_env() -> Environment:
    global _env
    if _env is None:
        _env = Environment(
            loader=FileSystemLoader(str(_PROMPT_DIR)),
            autoescape=False,
            trim_blocks=True,
            keep_trailing_newline=False,
        )
    return _env


def get_prompt(name: str, **variables: Any) -> str:
    """Load and render a Jinja2-templated prompt by agent *name*.

    Args:
        name: One of ``"lagna"``, ``"dasha"``, ``"varga"``,
            ``"forensic"``, ``"critic"``.
        **variables: Template variables to substitute.

    Returns:
        Rendered prompt string.

    Raises:
        ValueError: If *name* is not a recognised agent.
    """
    filename = _PROMPT_FILES.get(name)
    if filename is None:
        raise ValueError(f"Unknown prompt '{name}'. Available: {list(_PROMPT_FILES)}")
    env = _get_env()
    try:
        template = env.get_template(filename)
    except TemplateNotFound:
        raise RuntimeError(
            f"Prompt file '{filename}' not found in {_PROMPT_DIR}"
        ) from None

    rendered = template.render(**variables)
    return rendered


def list_available_prompts() -> list[str]:
    return list(_PROMPT_FILES)


__all__ = ["get_prompt", "list_available_prompts"]
