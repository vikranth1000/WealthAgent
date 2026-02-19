"""WealthAgentState — shared state TypedDict for the LangGraph StateGraph.

All agents read from and write to this single state object as defined in PRD §2.
"""

from __future__ import annotations

from typing import Optional, TypedDict


# ---------------------------------------------------------------------------
# Sub-structures (inline TypedDicts — kept lightweight, full Pydantic
# validation happens at the API boundary in api/schemas.py)
# ---------------------------------------------------------------------------


class PortfolioMetrics(TypedDict, total=False):
    """Key quantitative metrics produced by the Portfolio Analyzer."""

    total_value: float
    total_return_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    beta: float
    annualized_volatility: float


class AllocationBreakdown(TypedDict, total=False):
    """Current and target asset-class allocation percentages."""

    current: dict[str, float]   # e.g. {"US Equity": 0.58, "Bonds": 0.32, ...}
    target: dict[str, float]
    drift: dict[str, float]     # |current - target| per class


class RebalancingTrade(TypedDict):
    """A single suggested rebalancing trade."""

    ticker: str
    action: str         # "BUY" | "SELL"
    shares: float
    estimated_value: float
    reason: str


class TaxLossCandidate(TypedDict):
    """A holding flagged for potential tax-loss harvesting."""

    ticker: str
    unrealized_return_pct: float
    unrealized_loss_usd: float
    suggested_swap: Optional[str]


class PortfolioAnalysis(TypedDict, total=False):
    """Output produced by the Portfolio Analyzer agent."""

    summary: str
    total_value: float
    metrics: PortfolioMetrics
    allocation: AllocationBreakdown
    sector_breakdown: dict[str, float]
    rebalancing_trades: list[RebalancingTrade]
    tax_loss_candidates: list[TaxLossCandidate]
    risk_flags: list[str]


class MarketResearch(TypedDict, total=False):
    """Output produced by the Market Research agent."""

    summary: str
    portfolio_news: list[dict]  # [{ticker, headline, source, url, published_at}]
    macro_outlook: dict         # {fed_rate, inflation, unemployment, commentary}
    sector_trends: dict[str, float]  # sector ETF 1-month returns
    risk_alerts: list[str]


class ClientReport(TypedDict, total=False):
    """Output produced by the Client Communication agent."""

    greeting: str
    executive_summary: str
    portfolio_section: str
    market_section: str
    recommendations: list[str]
    disclaimer: str


# ---------------------------------------------------------------------------
# Primary LangGraph state
# ---------------------------------------------------------------------------


class WealthAgentState(TypedDict, total=False):
    """Shared state object flowing through every node in the LangGraph graph.

    Fields
    ------
    client_id : str
        UUID of the active client record.
    query : str
        The raw user message that triggered the run.
    persona : str
        One of: conservative_retiree | aggressive_growth |
        young_professional | institutional.
    portfolio_analysis : PortfolioAnalysis or None
        Populated by the Portfolio Analyzer node; None if not invoked.
    market_research : MarketResearch or None
        Populated by the Market Research node; None if not invoked.
    client_report : ClientReport or None
        Populated by the Client Communication node.
    chat_history : list[dict]
        Accumulated conversation turns ({role, content}) for context.
    current_agent : str
        Name of the currently executing agent — surfaced in the UI.
    error : str or None
        Set by any node on unrecoverable failure; triggers fallback.
    """

    client_id: str
    query: str
    persona: str
    portfolio_analysis: Optional[PortfolioAnalysis]
    market_research: Optional[MarketResearch]
    client_report: Optional[ClientReport]
    chat_history: list[dict]
    current_agent: str
    error: Optional[str]
