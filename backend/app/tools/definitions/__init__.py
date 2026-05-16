"""Tool definitions — register all 18 BTR tools.

Call ``register_all(registry)`` during application startup to
populate the central ``ToolRegistry``.
"""

from app.tools.base import ToolRegistry
from app.tools.definitions.dasha_tools import (
    KALACHAKRA_DASHA_SPEC,
    VIMSHOTTARI_DASHA_SPEC,
    YOGINI_DASHA_SPEC,
    tool_get_kalachakra_dasha,
    tool_get_vimshottari_dasha,
    tool_get_yogini_dasha,
)
from app.tools.definitions.ephemeris_tools import (
    PANCHANGA_SPEC,
    PLANETARY_SNAPSHOT_SPEC,
    SIGN_NAKSHATRA_SPEC,
    tool_get_panchanga,
    tool_get_planetary_snapshot,
    tool_get_sign_and_nakshatra,
)
from app.tools.definitions.forensic_tools import (
    GANDANTA_SPEC,
    NADI_AMSHA_D150_SPEC,
    SPOUSE_D9_VERIFICATION_SPEC,
    tool_get_gandanta_analysis,
    tool_get_nadi_amsha_d150,
    tool_get_spouse_d9_verification,
)
from app.tools.definitions.special_points_tools import (
    SPECIAL_POINTS_SPEC,
    tool_get_special_points,
)
from app.tools.definitions.strength_tools import (
    ASHTAKAVARGA_SPEC,
    KP_SUBLORDS_SPEC,
    SHADBALA_SPEC,
    tool_get_ashtakavarga,
    tool_get_kp_sublords,
    tool_get_shadbala,
)
from app.tools.definitions.varga_tools import (
    BOUNDARY_SAFETY_SPEC,
    DIVISIONAL_CHARTS_SPEC,
    FIND_BOUNDARY_CHANGES_SPEC,
    tool_find_boundary_changes,
    tool_get_boundary_safety,
    tool_get_divisional_charts,
)
from app.tools.definitions.yoga_tools import (
    MAHA_PURUSHA_YOGAS_SPEC,
    YOGAS_SPEC,
    tool_get_maha_purusha_yogas,
    tool_get_yogas,
)


def register_all(registry: ToolRegistry) -> None:
    """Register every available tool into *registry*."""
    registry.register(PLANETARY_SNAPSHOT_SPEC, tool_get_planetary_snapshot)
    registry.register(SIGN_NAKSHATRA_SPEC, tool_get_sign_and_nakshatra)
    registry.register(PANCHANGA_SPEC, tool_get_panchanga)
    registry.register(VIMSHOTTARI_DASHA_SPEC, tool_get_vimshottari_dasha)
    registry.register(YOGINI_DASHA_SPEC, tool_get_yogini_dasha)
    registry.register(KALACHAKRA_DASHA_SPEC, tool_get_kalachakra_dasha)
    registry.register(DIVISIONAL_CHARTS_SPEC, tool_get_divisional_charts)
    registry.register(BOUNDARY_SAFETY_SPEC, tool_get_boundary_safety)
    registry.register(FIND_BOUNDARY_CHANGES_SPEC, tool_find_boundary_changes)
    registry.register(SHADBALA_SPEC, tool_get_shadbala)
    registry.register(ASHTAKAVARGA_SPEC, tool_get_ashtakavarga)
    registry.register(KP_SUBLORDS_SPEC, tool_get_kp_sublords)
    registry.register(SPECIAL_POINTS_SPEC, tool_get_special_points)
    registry.register(YOGAS_SPEC, tool_get_yogas)
    registry.register(MAHA_PURUSHA_YOGAS_SPEC, tool_get_maha_purusha_yogas)
    registry.register(GANDANTA_SPEC, tool_get_gandanta_analysis)
    registry.register(NADI_AMSHA_D150_SPEC, tool_get_nadi_amsha_d150)
    registry.register(SPOUSE_D9_VERIFICATION_SPEC, tool_get_spouse_d9_verification)
