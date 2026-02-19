"""Prompt templates for the Client Communication agent.

Each template is a Python format string consumed by the comms agent.
Variables are filled in at runtime from WealthAgentState + PersonaConfig.

Template variable reference
----------------------------
{persona_display_name}   : e.g. "Margaret Chen"
{persona_style}          : PersonaConfig.style_description
{risk_framing}           : PersonaConfig.risk_framing
{client_name}            : client's first name
{query}                  : the original user question
{portfolio_analysis}     : serialised PortfolioAnalysis (may be empty string)
{market_research}        : serialised MarketResearch (may be empty string)
{chat_history}           : recent conversation turns for context (may be empty)
"""

from __future__ import annotations

from personas.definitions import PersonaConfig


# ---------------------------------------------------------------------------
# System prompt — sets the LLM's role and hard constraints
# ---------------------------------------------------------------------------

COMMS_SYSTEM_PROMPT = """\
You are a Client Communication specialist at a wealth management firm.
Your only job is to translate financial analysis into a clear, persona-appropriate \
response for the client.

RULES (non-negotiable):
1. Follow the persona style instructions exactly.
2. Never make up numbers — use only data provided in the analysis sections.
3. Always end every response with the disclaimer below, separated by a blank line.
4. Never recommend specific securities to buy or sell beyond what the analysis \
   already identified.
5. Never omit the disclaimer, even for very short responses.

DISCLAIMER (append verbatim):
---
*This is AI-generated analysis for informational purposes only. It does not \
constitute financial advice. Past performance is not indicative of future results. \
Please consult a qualified financial advisor before making investment decisions.*\
"""

# ---------------------------------------------------------------------------
# Main user-turn template (filled per request)
# ---------------------------------------------------------------------------

COMMS_USER_TEMPLATE = """\
=== CLIENT CONTEXT ===
Name: {client_name}
Persona: {persona_display_name}
Communication Style:
{persona_style}

Risk Framing Approach: {risk_framing}

=== ORIGINAL QUESTION ===
{query}

=== RECENT CHAT HISTORY ===
{chat_history}

=== PORTFOLIO ANALYSIS ===
{portfolio_analysis}

=== MARKET RESEARCH ===
{market_research}

=== INSTRUCTIONS ===
Write a response to the client's question using ONLY the data above.
Match the persona's reading level, tone, jargon level, data density, and length.
Do NOT add any analysis data that is not present above.
End with the required disclaimer.\
"""

# ---------------------------------------------------------------------------
# Fallback template — used when no analysis data is available
# ---------------------------------------------------------------------------

COMMS_FALLBACK_TEMPLATE = """\
=== CLIENT CONTEXT ===
Name: {client_name}
Persona: {persona_display_name}
Communication Style:
{persona_style}

=== ORIGINAL QUESTION ===
{query}

=== RECENT CHAT HISTORY ===
{chat_history}

=== INSTRUCTIONS ===
No portfolio or market analysis data is available for this query.
Provide a helpful, persona-appropriate response using general knowledge only.
Be clear that you do not have specific portfolio data to reference right now.
End with the required disclaimer.\
"""

# ---------------------------------------------------------------------------
# Builder functions
# ---------------------------------------------------------------------------


def build_system_prompt() -> str:
    """Return the static system prompt for the comms agent.

    Returns:
        The system prompt string.
    """
    return COMMS_SYSTEM_PROMPT


def build_user_prompt(
    *,
    persona: PersonaConfig,
    client_name: str,
    query: str,
    portfolio_analysis: str,
    market_research: str,
    chat_history: str,
) -> str:
    """Render the user-turn prompt for the comms agent.

    Selects the fallback template when no analysis data is present.

    Args:
        persona: The active PersonaConfig.
        client_name: The client's first name.
        query: The raw user question.
        portfolio_analysis: Serialised PortfolioAnalysis, or empty string.
        market_research: Serialised MarketResearch, or empty string.
        chat_history: Recent conversation turns as a plain-text block.

    Returns:
        Rendered prompt string ready to send to the LLM.
    """
    has_analysis = bool(portfolio_analysis.strip() or market_research.strip())

    template = COMMS_USER_TEMPLATE if has_analysis else COMMS_FALLBACK_TEMPLATE

    shared_vars = dict(
        client_name=client_name,
        persona_display_name=persona.display_name,
        persona_style=persona.style_description,
        risk_framing=persona.risk_framing,
        query=query,
        chat_history=chat_history or "(none)",
    )

    if has_analysis:
        return template.format(
            **shared_vars,
            portfolio_analysis=portfolio_analysis or "(not requested)",
            market_research=market_research or "(not requested)",
        )
    else:
        return template.format(**shared_vars)


def format_chat_history(messages: list[dict]) -> str:
    """Convert a list of chat message dicts to a plain-text block.

    Args:
        messages: List of dicts with 'role' and 'content' keys.
            Only the last 10 messages are included to stay within context.

    Returns:
        Formatted string with role prefixes, or "(none)" if empty.
    """
    if not messages:
        return "(none)"
    recent = messages[-10:]
    lines: list[str] = []
    for msg in recent:
        role = msg.get("role", "unknown").upper()
        content = msg.get("content", "").strip()
        lines.append(f"{role}: {content}")
    return "\n".join(lines)
