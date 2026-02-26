"""Client Communication Agent — LLM-only, persona-adapted output.

This module provides two callables for use by the LangGraph orchestrator:

* ``comms_agent_node`` — standard LangGraph node; returns a partial state
  update dict with the populated ``ClientReport``.
* ``comms_agent_stream`` — async generator that yields token chunks via the
  Anthropic streaming API; consumed by the WebSocket endpoint.

Error-handling strategy (PRD §9)
---------------------------------
- **Timeout** : retry once after 5 s; fall back to ``FALLBACK_MESSAGE`` on
  second failure.
- **Rate limit** : exponential backoff — 2 s, 4 s, 8 s — before giving up.
- **Any other failure** : log at ERROR level, return ``FALLBACK_MESSAGE``.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator

import anthropic

from agents.state import ClientReport, WealthAgentState
from config import settings
from personas.definitions import get_persona
from personas.templates import build_system_prompt, build_user_prompt, format_chat_history

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODEL = "claude-sonnet-4-20250514"
_MAX_TOKENS = 2048
_CALL_TIMEOUT = 30.0        # seconds before a single LLM call is timed out
_TIMEOUT_RETRY_DELAY = 5.0  # seconds to wait before retrying after a timeout
_RATE_LIMIT_DELAYS = (2.0, 4.0, 8.0)  # backoff schedule for 429 errors

FALLBACK_MESSAGE = (
    "I'm sorry, I'm having trouble generating a response right now. "
    "Please try again."
)


def format_portfolio_for_llm(analysis: dict) -> str:
    """Format portfolio analysis into structured text the LLM can reason about.

    Converts raw JSON analytics into a dense, readable format so the comms
    agent produces responses with accurate, specific numbers.

    Args:
        analysis: PortfolioAnalysis dict from the portfolio agent.

    Returns:
        Structured text block with portfolio data.
    """
    if not analysis:
        return ""

    lines: list[str] = []

    # Portfolio overview
    total_val = analysis.get("total_value", 0)
    metrics = analysis.get("metrics", {})
    ret_pct = metrics.get("total_return_pct", 0)
    lines.append(
        f"PORTFOLIO OVERVIEW: Total Value ${total_val:,.0f} | "
        f"Return {ret_pct:+.1%}"
    )

    # Key metrics
    metric_parts: list[str] = []
    if "sharpe_ratio" in metrics:
        metric_parts.append(f"Sharpe {metrics['sharpe_ratio']:.2f}")
    if "sortino_ratio" in metrics:
        metric_parts.append(f"Sortino {metrics['sortino_ratio']:.2f}")
    if "max_drawdown" in metrics:
        metric_parts.append(f"Max DD {metrics['max_drawdown']:.1%}")
    if "beta" in metrics:
        metric_parts.append(f"Beta {metrics['beta']:.2f}")
    if "annualized_volatility" in metrics:
        metric_parts.append(f"Vol {metrics['annualized_volatility']:.1%}")
    if metric_parts:
        lines.append(f"KEY METRICS: {' | '.join(metric_parts)}")

    # Allocation with drift
    alloc = analysis.get("allocation", {})
    curr = alloc.get("current", {})
    target = alloc.get("target", {})
    drift = alloc.get("drift", {})
    if curr:
        alloc_parts = []
        for cls in sorted(curr.keys()):
            c_pct = curr[cls] * 100
            t_pct = target.get(cls, 0) * 100
            d_pct = drift.get(cls, 0) * 100
            drift_str = f" ({d_pct:+.1f}% drift)" if d_pct >= 1.0 else ""
            alloc_parts.append(f"{cls} {c_pct:.1f}%→{t_pct:.1f}%{drift_str}")
        lines.append(f"ALLOCATION: {' | '.join(alloc_parts)}")

    # Risk flags
    flags = analysis.get("risk_flags", [])
    if flags:
        lines.append(f"RISK FLAGS: {' | '.join(flags)}")

    # Tax-loss candidates
    tax_candidates = analysis.get("tax_loss_candidates", [])
    if tax_candidates:
        tickers = [c["ticker"] for c in tax_candidates]
        total_loss = sum(c.get("unrealized_loss_usd", 0) for c in tax_candidates)
        lines.append(
            f"TAX-LOSS CANDIDATES: {', '.join(tickers)} "
            f"(total harvestable: ${abs(total_loss):,.0f})"
        )

    # Periodic performance (compact format to save tokens)
    periodic = analysis.get("periodic_returns", {})
    if periodic:
        parts: list[str] = []
        ytd = periodic.get("ytd")
        if ytd is not None:
            parts.append(f"YTD {ytd:+.1%}")
        for label, val in periodic.get("recent", {}).items():
            parts.append(f"{label} {val:+.1%}")
        for q in periodic.get("quarterly", []):
            parts.append(f"{q['period']} {q['return_pct']:+.1%}")
        best = periodic.get("best_month")
        worst = periodic.get("worst_month")
        if best and worst:
            parts.append(f"Best:{best['period']}({best['return_pct']:+.1%})")
            parts.append(f"Worst:{worst['period']}({worst['return_pct']:+.1%})")
        if parts:
            lines.append(f"PERFORMANCE: {' | '.join(parts)}")

    # Rebalancing trades
    trades = analysis.get("rebalancing_trades", [])
    if trades:
        trade_parts = []
        for t in trades:
            action = t.get("action", "")
            shares = t.get("shares", 0)
            ticker = t.get("ticker", "")
            value = t.get("estimated_value", 0)
            trade_parts.append(f"{action} {shares:.0f} {ticker} (${value:,.0f})")
        lines.append(f"REBALANCING: {' | '.join(trade_parts)}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _make_client() -> anthropic.AsyncAnthropic:
    """Instantiate an AsyncAnthropic client from settings.

    Returns:
        A configured ``AsyncAnthropic`` instance.
    """
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


def _build_prompts(state: WealthAgentState) -> tuple[str, str]:
    """Construct the system and user prompts from the current state.

    Uses ``format_portfolio_for_llm`` to produce structured text instead of
    raw JSON dumps, so the LLM can reference specific numbers accurately.

    Args:
        state: The current ``WealthAgentState`` flowing through the graph.

    Returns:
        A ``(system_prompt, user_prompt)`` tuple ready for the LLM.

    Raises:
        ValueError: If ``state["persona"]`` is not a recognised persona key.
    """
    persona = get_persona(state["persona"])

    portfolio_raw = state.get("portfolio_analysis")
    portfolio_str = format_portfolio_for_llm(portfolio_raw) if portfolio_raw else ""

    market_raw = state.get("market_research")
    market_str = (
        json.dumps(market_raw, separators=(",", ":")) if market_raw is not None else ""
    )

    history_str = format_chat_history(state.get("chat_history", []))

    client_name = state.get("client_name", "Client")

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(
        persona=persona,
        client_name=client_name,
        query=state.get("query", ""),
        portfolio_analysis=portfolio_str,
        market_research=market_str,
        chat_history=history_str,
    )

    return system_prompt, user_prompt


async def _call_api(
    client: anthropic.AsyncAnthropic,
    system_prompt: str,
    user_prompt: str,
) -> str:
    """Make a single, timeout-guarded call to the Anthropic Messages API.

    Args:
        client: An ``AsyncAnthropic`` SDK instance.
        system_prompt: The system turn content.
        user_prompt: The user turn content.

    Returns:
        The first text block from the model response.

    Raises:
        asyncio.TimeoutError: If the call does not complete within
            ``_CALL_TIMEOUT`` seconds.
        anthropic.RateLimitError: Propagated from the SDK on HTTP 429.
    """
    response = await asyncio.wait_for(
        client.messages.create(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        ),
        timeout=_CALL_TIMEOUT,
    )
    return response.content[0].text


async def _call_with_backoff(
    client: anthropic.AsyncAnthropic,
    system_prompt: str,
    user_prompt: str,
) -> str:
    """Wrap ``_call_api`` with rate-limit exponential backoff.

    Tries up to ``len(_RATE_LIMIT_DELAYS) + 1`` times.  On each
    ``RateLimitError`` the function sleeps for the next delay in
    ``_RATE_LIMIT_DELAYS`` before retrying.  If the final attempt also fails,
    the exception is re-raised.

    Args:
        client: An ``AsyncAnthropic`` SDK instance.
        system_prompt: The system turn content.
        user_prompt: The user turn content.

    Returns:
        Response text from the model.

    Raises:
        anthropic.RateLimitError: After all backoff attempts are exhausted.
        asyncio.TimeoutError: Propagated from ``_call_api`` (not caught here).
    """
    for delay in _RATE_LIMIT_DELAYS:
        try:
            return await _call_api(client, system_prompt, user_prompt)
        except anthropic.RateLimitError:
            logger.warning(
                "comms_agent: rate limit hit — backing off %.0f s", delay
            )
            await asyncio.sleep(delay)

    # Final attempt after all backoff delays are exhausted.
    try:
        return await _call_api(client, system_prompt, user_prompt)
    except anthropic.RateLimitError:
        logger.error("comms_agent: rate limit not resolved after all backoffs")
        raise


async def _call_with_retry(system_prompt: str, user_prompt: str) -> str:
    """Full retry strategy: one timeout retry + rate-limit backoff.

    On a ``TimeoutError`` from the first attempt the function waits
    ``_TIMEOUT_RETRY_DELAY`` seconds and tries once more.  Any error on the
    second attempt propagates to the caller.

    Args:
        system_prompt: The system turn content.
        user_prompt: The user turn content.

    Returns:
        Response text from the model.

    Raises:
        Exception: If all retry strategies are exhausted.
    """
    client = _make_client()

    try:
        return await _call_with_backoff(client, system_prompt, user_prompt)
    except asyncio.TimeoutError:
        logger.warning(
            "comms_agent: LLM timed out — retrying after %.0f s",
            _TIMEOUT_RETRY_DELAY,
        )
        await asyncio.sleep(_TIMEOUT_RETRY_DELAY)

    # Single retry after timeout — let all exceptions propagate.
    return await _call_with_backoff(client, system_prompt, user_prompt)


def _fallback_report() -> ClientReport:
    """Return a minimal ``ClientReport`` containing only the fallback message.

    Returns:
        A ``ClientReport`` with ``executive_summary`` set to
        ``FALLBACK_MESSAGE`` and all other fields at safe defaults.
    """
    return ClientReport(
        greeting="",
        executive_summary=FALLBACK_MESSAGE,
        portfolio_section="",
        market_section="",
        recommendations=[],
        disclaimer="",
    )


# ---------------------------------------------------------------------------
# Public LangGraph node
# ---------------------------------------------------------------------------


async def comms_agent_node(state: WealthAgentState) -> dict:
    """LangGraph node for the Client Communication agent.

    Reads ``portfolio_analysis`` and ``market_research`` from *state* (both
    optional), builds persona-appropriate prompts, calls Claude, and returns a
    partial state update.  The orchestrator uses
    ``client_report["executive_summary"]`` as the primary response text.

    The full LLM response is placed in ``executive_summary``; structured fields
    (``greeting``, ``portfolio_section``, ``market_section``,
    ``recommendations``, ``disclaimer``) are left as empty defaults because the
    LLM returns free-form text — they can be parsed in a later phase.

    Args:
        state: Current ``WealthAgentState`` flowing through the graph.

    Returns:
        Partial state update dict with:
        - ``current_agent`` set to ``"comms"``
        - ``client_report`` populated (fallback on failure)
        - ``error`` set to an error string on failure, absent otherwise
    """
    logger.info(
        "comms_agent: start — client_id=%s persona=%s",
        state.get("client_id"),
        state.get("persona"),
    )

    base: dict = {"current_agent": "comms"}

    # --- Build prompts --------------------------------------------------
    try:
        system_prompt, user_prompt = _build_prompts(state)
    except (ValueError, KeyError) as exc:
        logger.error("comms_agent: prompt construction failed: %s", exc)
        return {**base, "client_report": _fallback_report(), "error": str(exc)}

    # --- Call LLM with retry/backoff ------------------------------------
    try:
        response_text = await _call_with_retry(system_prompt, user_prompt)
    except Exception as exc:  # noqa: BLE001
        logger.error("comms_agent: LLM call failed after all retries: %s", exc)
        return {**base, "client_report": _fallback_report(), "error": str(exc)}

    logger.info(
        "comms_agent: response received (%d chars)", len(response_text)
    )

    report: ClientReport = {
        "greeting": "",
        "executive_summary": response_text,
        "portfolio_section": "",
        "market_section": "",
        "recommendations": [],
        "disclaimer": "",
    }
    return {**base, "client_report": report}


# ---------------------------------------------------------------------------
# Streaming variant (for WebSocket endpoint)
# ---------------------------------------------------------------------------


async def comms_agent_stream(
    state: WealthAgentState,
) -> AsyncGenerator[str, None]:
    """Streaming variant — yields token chunks from the Anthropic stream API.

    Intended for use by the WebSocket endpoint to push real-time tokens to the
    browser.  Yields ``FALLBACK_MESSAGE`` as a single chunk on any error so
    the caller always receives a coherent response.

    Args:
        state: Current ``WealthAgentState`` flowing through the graph.

    Yields:
        Token chunks (``str``) from the model's text stream.
    """
    try:
        system_prompt, user_prompt = _build_prompts(state)
    except (ValueError, KeyError) as exc:
        logger.error("comms_agent_stream: prompt construction failed: %s", exc)
        yield FALLBACK_MESSAGE
        return

    client = _make_client()

    try:
        async with client.messages.stream(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        ) as stream:
            async for chunk in stream.text_stream:
                yield chunk
    except anthropic.RateLimitError as exc:
        logger.error("comms_agent_stream: rate limit error: %s", exc)
        yield FALLBACK_MESSAGE
    except asyncio.TimeoutError as exc:
        logger.error("comms_agent_stream: timeout: %s", exc)
        yield FALLBACK_MESSAGE
    except Exception as exc:  # noqa: BLE001
        logger.error("comms_agent_stream: unexpected error: %s", exc)
        yield FALLBACK_MESSAGE


# ---------------------------------------------------------------------------
# Follow-up suggestion generator
# ---------------------------------------------------------------------------

_SUGGESTIONS_SYSTEM = """\
You generate 3 short follow-up questions for a wealth management advisor \
who is analyzing a client's portfolio. The advisor is NOT the client — \
they manage the client. Phrase questions from the advisor's perspective, \
referring to the client in the third person (e.g. "their", "this portfolio", \
"the client's"). NEVER use "my" or "I" as if the user is the client. \
Output ONLY a JSON array of 3 strings. \
Each question should be under 60 characters. No explanation, no markdown.\
"""


async def generate_follow_up_suggestions(
    query: str,
    response_summary: str,
    persona: str,
) -> list[str]:
    """Generate 3 contextual follow-up question suggestions.

    Makes a lightweight LLM call after the main response completes.
    Returns an empty list on any failure so the UI can fall back to
    static persona prompts.

    Args:
        query: The user's original question.
        response_summary: First ~300 chars of the AI response.
        persona: The persona key for context.

    Returns:
        List of 3 follow-up question strings, or empty list on error.
    """
    client = _make_client()

    user_msg = (
        f"Persona: {persona}\n"
        f"Advisor asked: {query}\n"
        f"AI responded (summary): {response_summary[:300]}\n\n"
        "Generate 3 follow-up questions the advisor might ask next about "
        "this client's portfolio. Use third-person language (their/the client's). "
        "JSON array only."
    )

    try:
        response = await asyncio.wait_for(
            client.messages.create(
                model=_MODEL,
                max_tokens=150,
                system=_SUGGESTIONS_SYSTEM,
                messages=[{"role": "user", "content": user_msg}],
            ),
            timeout=10.0,
        )
        text = response.content[0].text.strip()
        suggestions = json.loads(text)
        if isinstance(suggestions, list) and len(suggestions) >= 3:
            return [str(s) for s in suggestions[:3]]
        return []
    except Exception as exc:
        logger.warning("generate_follow_up_suggestions: failed: %s", exc)
        return []
