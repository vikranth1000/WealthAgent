"""Persona definitions for WealthAgent's four client archetypes.

Each PersonaConfig captures all communication dimensions from PRD §4.
"""

from dataclasses import dataclass, field
from typing import Literal

PersonaKey = Literal[
    "conservative_retiree",
    "aggressive_growth",
    "young_professional",
    "institutional",
]


@dataclass(frozen=True)
class PersonaConfig:
    """All communication-style dimensions for a single client persona."""

    key: PersonaKey
    display_name: str
    reading_level: str          # e.g. "8th grade", "College"
    tone: str                   # short descriptor string
    jargon_level: str           # "none" | "low" | "moderate" | "high"
    jargon_explanations: bool   # whether to explain jargon inline
    data_density: str           # "low" | "medium" | "medium-high" | "very_high"
    risk_framing: str           # canonical phrase / approach
    response_length: str        # "short" | "medium" | "medium-long"
    suggested_prompts: list[str] = field(default_factory=list)
    # Human-readable description used as system-prompt context for the comms agent
    style_description: str = ""


CONSERVATIVE_RETIREE = PersonaConfig(
    key="conservative_retiree",
    display_name="Conservative Retiree",
    reading_level="8th grade",
    tone="Warm, reassuring, patient",
    jargon_level="none",
    jargon_explanations=False,
    data_density="low",
    risk_framing="Your savings are safe",
    response_length="medium",
    suggested_prompts=[
        "How is my portfolio doing?",
        "Is my income still steady?",
        "Am I taking on too much risk?",
        "What are my dividends this month?",
        "Should I make any changes?",
    ],
    style_description=(
        "Write at an 8th-grade reading level. Use everyday language — avoid financial "
        "jargon entirely. The client is a retired person who prioritises safety over "
        "growth. Lead with reassurance, mention income and stability first. Keep numbers "
        "simple (round to hundreds). Offer gentle, concrete next steps. Response length "
        "should be moderate — enough to feel thorough but never overwhelming."
    ),
)

AGGRESSIVE_GROWTH = PersonaConfig(
    key="aggressive_growth",
    display_name="Aggressive Growth",
    reading_level="College",
    tone="Direct, concise, action-oriented",
    jargon_level="moderate",
    jargon_explanations=False,
    data_density="medium-high",
    risk_framing="Upside potential",
    response_length="short",
    suggested_prompts=[
        "Tax harvesting opportunities?",
        "Where is my biggest alpha source?",
        "Show me concentration risk",
        "What's my max drawdown this month?",
        "Any momentum plays I'm missing?",
    ],
    style_description=(
        "Be direct and dense — no filler text. Lead with key numbers and action items. "
        "Use standard investment terminology (alpha, drawdown, wash sale) without "
        "explaining it. Frame everything through the lens of upside potential and "
        "portfolio optimization. Short bullets preferred over prose. Assume high "
        "financial literacy."
    ),
)

YOUNG_PROFESSIONAL = PersonaConfig(
    key="young_professional",
    display_name="Young Professional",
    reading_level="High school",
    tone="Encouraging, educational, conversational",
    jargon_level="low",
    jargon_explanations=True,
    data_density="medium",
    risk_framing="Here's what this means for you",
    response_length="medium-long",
    suggested_prompts=[
        "Explain my portfolio risk",
        "Am I diversified enough?",
        "What is a Sharpe ratio?",
        "How should I rebalance?",
        "What does volatility mean for me?",
    ],
    style_description=(
        "Use high-school level language. When technical terms are necessary, explain "
        "them in plain English immediately after (e.g., 'Sharpe ratio — a measure of "
        "return per unit of risk'). Be encouraging and frame outcomes as learning "
        "opportunities. Include practical context for why numbers matter. Medium-to-long "
        "responses are appropriate — the client wants to understand, not just be told."
    ),
)

INSTITUTIONAL = PersonaConfig(
    key="institutional",
    display_name="Institutional",
    reading_level="Graduate / CFA",
    tone="Neutral, quantitative, precise",
    jargon_level="high",
    jargon_explanations=False,
    data_density="very_high",
    risk_framing="Raw numbers and factor attribution",
    response_length="short",
    suggested_prompts=[
        "Performance attribution this quarter",
        "Factor exposure breakdown",
        "Sharpe vs benchmark",
        "Tracking error and active share",
        "Tail risk metrics",
    ],
    style_description=(
        "Write at CFA/graduate level. Use full professional terminology without "
        "explanation (bps, OW/UW, attribution, factor loadings, tracking error, "
        "max DD). Present data in a dense, structured format — short paragraphs or "
        "labelled lines. No preamble, no pleasantries. Prioritise precision and "
        "information density over readability. Abbreviate freely."
    ),
)

# Registry — single source of truth for all persona lookups
PERSONAS: dict[PersonaKey, PersonaConfig] = {
    "conservative_retiree": CONSERVATIVE_RETIREE,
    "aggressive_growth": AGGRESSIVE_GROWTH,
    "young_professional": YOUNG_PROFESSIONAL,
    "institutional": INSTITUTIONAL,
}


def get_persona(key: str) -> PersonaConfig:
    """Return a PersonaConfig by key, raising ValueError for unknown keys.

    Args:
        key: One of the four valid persona keys.

    Returns:
        The matching PersonaConfig.

    Raises:
        ValueError: If the key does not match any known persona.
    """
    if key not in PERSONAS:
        valid = ", ".join(PERSONAS.keys())
        raise ValueError(f"Unknown persona '{key}'. Valid options: {valid}")
    return PERSONAS[key]  # type: ignore[index]
