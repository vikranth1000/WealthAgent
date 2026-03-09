"""LangGraph orchestrator — classifies query intent and routes to agent chains.

Flow per PRD §2:
    START → route_query (LLM classifier)
      ├── "portfolio"    → Portfolio Agent → Comms Agent → END
      ├── "market"       → Portfolio Agent → Market Agent → Comms Agent → END
      └── "full_review"  → Portfolio Agent → Market Agent → Comms Agent → END

Portfolio agent always runs so the comms agent always has real client data.
The orchestrator routes but does NOT process. No business logic lives here.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Literal

import openai
from langgraph.graph import END, StateGraph

from agents.comms_agent import comms_agent_node
from agents.market_agent import market_research_node
from agents.portfolio_agent import portfolio_analyzer_node
from agents.state import WealthAgentState
from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Intent classification
# ---------------------------------------------------------------------------

_ROUTE_MODEL = "sonar-pro"

_ROUTE_SYSTEM_PROMPT = """\
You are a query intent classifier for a wealth management assistant.
Every query comes from an advisor managing a specific client's portfolio.
Classify the user's query into EXACTLY one of these categories:

- portfolio: Questions about the client's holdings, allocation, performance, \
rebalancing, tax-loss harvesting, risk metrics, Sharpe ratio, returns, \
investment advice, financial education, or any question that benefits from \
having the client's portfolio context.
- market: Questions specifically about market conditions, news, macro indicators, \
sector performance, interest rates, economic outlook, or specific stock/sector \
research that also benefits from portfolio context.
- full_review: Requests for a comprehensive review that combine both portfolio \
analysis AND market context (e.g. "Give me a full report", "How should we \
position given the market?", "Complete portfolio review").

When in doubt, choose "portfolio" — the advisor always benefits from seeing \
client data alongside any response.

Respond with ONLY the category name, nothing else."""

QueryIntent = Literal["portfolio", "market", "full_review"]

_VALID_INTENTS: set[str] = {"portfolio", "market", "full_review"}


async def classify_intent(query: str) -> QueryIntent:
    """Classify user query into one of three routing intents.

    Uses a lightweight LLM call. Falls back to "portfolio" on any failure
    so the comms agent always has real portfolio data.

    Args:
        query: The raw user message.

    Returns:
        One of: "portfolio", "market", "full_review".
    """
    try:
        client = openai.AsyncOpenAI(
            api_key=settings.perplexity_api_key,
            base_url="https://api.perplexity.ai"
        )
        response = await client.chat.completions.create(
            model=_ROUTE_MODEL,
            max_tokens=20,
            messages=[
                {"role": "system", "content": _ROUTE_SYSTEM_PROMPT},
                {"role": "user", "content": query}
            ],
        )
        intent = (response.choices[0].message.content or "").strip().lower()

        if intent in _VALID_INTENTS:
            logger.info("classify_intent: %r → %s", query[:80], intent)
            return intent  # type: ignore[return-value]

        logger.warning(
            "classify_intent: unexpected response %r — defaulting to portfolio",
            intent,
        )
        return "portfolio"

    except Exception as exc:
        logger.error("classify_intent: LLM call failed (%s) — defaulting to portfolio", exc)
        return "portfolio"


# ---------------------------------------------------------------------------
# Router node (sets current_agent and intent in state)
# ---------------------------------------------------------------------------


async def route_query_node(state: WealthAgentState) -> dict[str, Any]:
    """Classify the query intent and store it in state.

    Args:
        state: Current WealthAgentState.

    Returns:
        Partial state update with current_agent and _intent.
    """
    query = state.get("query", "")
    intent = await classify_intent(query)
    return {"current_agent": "orchestrator", "_intent": intent}


# ---------------------------------------------------------------------------
# Build the StateGraph
# ---------------------------------------------------------------------------


def build_graph() -> StateGraph:
    """Construct and compile the WealthAgent LangGraph StateGraph.

    Returns:
        A compiled LangGraph graph ready to invoke or stream.
    """
    # Extend state with internal _intent field
    graph = StateGraph(dict)

    # Add nodes
    graph.add_node("route_query", route_query_node)
    graph.add_node("portfolio_analyzer", portfolio_analyzer_node)
    graph.add_node("market_research", market_research_node)
    graph.add_node("comms", comms_agent_node)

    # Entry point
    graph.set_entry_point("route_query")

    # All queries start with portfolio analysis
    graph.add_edge("route_query", "portfolio_analyzer")

    # After portfolio: market or full_review → market_research, else → comms
    def _after_portfolio(state: dict) -> str:
        if state.get("_intent") in ("market", "full_review"):
            return "market_research"
        return "comms"

    graph.add_conditional_edges(
        "portfolio_analyzer",
        _after_portfolio,
        {
            "market_research": "market_research",
            "comms": "comms",
        },
    )

    # Market research always flows to comms
    graph.add_edge("market_research", "comms")

    # Comms is always the final node
    graph.add_edge("comms", END)

    return graph.compile()


# Module-level compiled graph (reused across requests)
graph = build_graph()


async def run_orchestrator(
    client_id: str,
    query: str,
    persona: str,
    chat_history: list[dict] | None = None,
) -> WealthAgentState:
    """Run the full orchestrator pipeline and return the final state.

    Args:
        client_id: UUID of the client.
        query: User's chat message.
        persona: Persona key string.
        chat_history: Previous conversation turns.

    Returns:
        The final WealthAgentState after all agents have run.
    """
    initial_state: dict[str, Any] = {
        "client_id": client_id,
        "client_name": "",
        "query": query,
        "persona": persona,
        "chat_history": chat_history or [],
        "portfolio_analysis": None,
        "market_research": None,
        "client_report": None,
        "current_agent": "",
        "error": None,
    }

    logger.info(
        "orchestrator: starting — client=%s persona=%s query=%r",
        client_id, persona, query[:80],
    )

    result = await graph.ainvoke(initial_state)

    logger.info(
        "orchestrator: complete — final_agent=%s has_report=%s",
        result.get("current_agent"),
        result.get("client_report") is not None,
    )

    return result


async def run_orchestrator_streaming(
    client_id: str,
    query: str,
    persona: str,
    chat_history: list[dict] | None = None,
):
    """Run the orchestrator and yield (event_type, data) tuples for WebSocket streaming.

    Runs portfolio/market agents normally, then streams the comms agent response.

    Args:
        client_id: UUID of the client.
        query: User's chat message.
        persona: Persona key string.
        chat_history: Previous conversation turns.

    Yields:
        Tuples of (event_type, data) where event_type is one of:
        - "agent_start": data is the agent name
        - "chunk": data is a text chunk
        - "done": data is the final state dict
        - "error": data is an error message
    """
    from agents.comms_agent import comms_agent_stream

    initial_state: dict[str, Any] = {
        "client_id": client_id,
        "client_name": "",
        "query": query,
        "persona": persona,
        "chat_history": chat_history or [],
        "portfolio_analysis": None,
        "market_research": None,
        "client_report": None,
        "current_agent": "",
        "error": None,
    }

    # --- Classify intent + run portfolio agent in parallel ---
    yield ("agent_start", "portfolio_analyzer")

    intent_task = asyncio.create_task(classify_intent(query))
    portfolio_task = asyncio.create_task(portfolio_analyzer_node(initial_state))

    try:
        intent, portfolio_update = await asyncio.gather(intent_task, portfolio_task)
        initial_state["_intent"] = intent
        initial_state.update(portfolio_update)
    except Exception as exc:
        logger.error("orchestrator_streaming: parallel phase failed: %s", exc)
        initial_state["error"] = str(exc)
        # Ensure intent is set even on portfolio failure
        try:
            intent = await intent_task
        except Exception:
            intent = "portfolio"
        initial_state["_intent"] = intent

    logger.info(
        "orchestrator_streaming: intent=%s client=%s", intent, client_id
    )

    # --- Market agent runs for market or full_review intents ---
    if intent in ("market", "full_review"):
        yield ("agent_start", "market_research")
        try:
            update = await market_research_node(initial_state)
            initial_state.update(update)
        except Exception as exc:
            logger.error("orchestrator_streaming: market agent failed: %s", exc)
            initial_state["error"] = str(exc)

    # --- Stream comms agent ---
    yield ("agent_start", "comms")

    full_response = ""
    async for chunk in comms_agent_stream(initial_state):
        full_response += chunk
        yield ("chunk", chunk)

    # Generate follow-up suggestions (lightweight, non-blocking for UX)
    from agents.comms_agent import generate_follow_up_suggestions

    suggestions = await generate_follow_up_suggestions(
        query=query,
        response_summary=full_response[:300],
        persona=persona,
    )

    # Build final report
    report = {
        "greeting": "",
        "executive_summary": full_response,
        "portfolio_section": "",
        "market_section": "",
        "recommendations": [],
        "disclaimer": "",
    }
    initial_state["client_report"] = report
    initial_state["current_agent"] = "comms"
    initial_state["suggestions"] = suggestions

    yield ("done", initial_state)
