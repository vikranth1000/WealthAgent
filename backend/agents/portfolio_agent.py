"""Portfolio Analyzer Agent — LangGraph node function.

Loads holdings from the database, computes all portfolio analytics via the
pure-math analytics modules, and returns a PortfolioAnalysis state update.

This is a single node function intended to be wired into the orchestrator's
StateGraph. It does NOT build its own graph.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import logging
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from agents.state import (
    AllocationBreakdown,
    PortfolioAnalysis,
    PortfolioMetrics,
    RebalancingTrade as StateRebalancingTrade,
    TaxLossCandidate as StateTaxLossCandidate,
    WealthAgentState,
)
from analytics.metrics import (
    annualized_volatility,
    beta as compute_beta,
    max_drawdown,
    sharpe_ratio,
    sortino_ratio,
)
from analytics.portfolio import (
    Holding as AnalyticsHolding,
    current_allocation,
    get_current_prices,
    sector_breakdown,
    total_portfolio_value,
    total_return,
)
from analytics.rebalancing import allocation_drift, rebalancing_trades
from analytics.tax_loss import tax_loss_candidates
from data.database import AsyncSessionLocal
from data.models import Client, Portfolio

logger = logging.getLogger(__name__)

_BENCHMARK_TICKER = "SPY"
_HISTORY_PERIOD = "1y"


# ---------------------------------------------------------------------------
# Synchronous helpers (run in a thread-pool executor so they don't block
# the async event loop)
# ---------------------------------------------------------------------------


def _sync_fetch_history(tickers: list[str], period: str) -> pd.DataFrame:
    """Fetch adjusted daily close prices for *tickers* over *period*.

    Args:
        tickers: Ticker symbols to download (benchmark included by caller).
        period: yfinance period string, e.g. ``"1y"``.

    Returns:
        DataFrame with DatetimeIndex and one column per ticker.
        Returns an empty DataFrame on failure.
    """
    try:
        data = yf.download(tickers, period=period, progress=False, auto_adjust=True)
        if data.empty:
            return pd.DataFrame()
        close = data["Close"]
        if isinstance(close, pd.Series):
            close = close.to_frame(name=tickers[0])
        return close
    except Exception as exc:
        logger.warning("yfinance history download failed: %s", exc)
        return pd.DataFrame()


def _sync_get_prices(tickers: list[str]) -> dict[str, float]:
    """Thin wrapper so ``get_current_prices`` can be run in an executor."""
    return get_current_prices(tickers)


# ---------------------------------------------------------------------------
# Returns computation helpers
# ---------------------------------------------------------------------------


def _weighted_portfolio_returns(
    close_df: pd.DataFrame,
    weights: dict[str, float],
) -> pd.Series:
    """Compute a daily portfolio-return Series from a close-price DataFrame.

    Weights are normalised to the tickers that are actually present in
    *close_df* so that a missing ticker does not silently zero the whole
    portfolio.

    Args:
        close_df: DataFrame of adjusted close prices (rows = dates).
        weights: Mapping of ticker → portfolio weight fraction (sums to 1).

    Returns:
        Pandas Series of daily portfolio returns indexed by date.
        Returns an empty Series if no tickers overlap.
    """
    available = [t for t in weights if t in close_df.columns]
    if not available:
        return pd.Series(dtype=float)

    total_w = sum(weights[t] for t in available)
    if total_w == 0.0:
        return pd.Series(dtype=float)

    norm_weights = {t: weights[t] / total_w for t in available}
    daily_rets = close_df[available].pct_change()

    port_rets = pd.Series(0.0, index=daily_rets.index)
    for ticker in available:
        port_rets = port_rets + daily_rets[ticker].fillna(0.0) * norm_weights[ticker]

    return port_rets.dropna()


def _align_portfolio_and_benchmark(
    close_df: pd.DataFrame,
    weights: dict[str, float],
    benchmark: str,
) -> tuple[list[float], list[float]]:
    """Return aligned (portfolio_returns, benchmark_returns) as plain float lists.

    Both series are aligned on their shared date index so they can be passed
    directly to ``analytics.metrics.beta``.

    Args:
        close_df: Daily close-price DataFrame.
        weights: Portfolio weights by ticker.
        benchmark: Benchmark ticker symbol (e.g. ``"SPY"``).

    Returns:
        Tuple of (portfolio_returns, benchmark_returns). Both lists are the
        same length. Returns ([], []) if alignment fails.
    """
    port_rets = _weighted_portfolio_returns(close_df, weights)
    if port_rets.empty or benchmark not in close_df.columns:
        return [], []

    bench_rets = close_df[benchmark].pct_change()

    aligned = pd.DataFrame({"port": port_rets, "bench": bench_rets}).dropna()
    if aligned.empty:
        return [], []

    return list(aligned["port"]), list(aligned["bench"])


# ---------------------------------------------------------------------------
# Risk flag generator
# ---------------------------------------------------------------------------


def _build_risk_flags(
    metrics: PortfolioMetrics,
    drift: dict[str, float],
    tax_candidates: list[StateTaxLossCandidate],
) -> list[str]:
    """Produce a list of plain-English risk warnings from computed analytics.

    Args:
        metrics: Computed portfolio metrics.
        drift: Per-asset-class allocation drift fractions.
        tax_candidates: Tax-loss harvesting candidates.

    Returns:
        List of risk flag strings. Empty when no issues are detected.
    """
    flags: list[str] = []

    mdd = metrics.get("max_drawdown", 0.0)
    if mdd <= -0.20:
        flags.append(f"Severe max drawdown: {mdd:.1%}")
    elif mdd <= -0.10:
        flags.append(f"Notable max drawdown: {mdd:.1%}")

    vol = metrics.get("annualized_volatility", 0.0)
    if vol >= 0.30:
        flags.append(f"High annualized volatility: {vol:.1%}")
    elif vol >= 0.20:
        flags.append(f"Elevated annualized volatility: {vol:.1%}")

    sharpe = metrics.get("sharpe_ratio")
    if sharpe is not None and sharpe < 0.5:
        flags.append(f"Low Sharpe ratio: {sharpe:.2f} (target ≥ 1.0)")

    for asset_class, d in drift.items():
        if d >= 0.10:
            flags.append(f"Large allocation drift in {asset_class}: {d:.1%}")
        elif d >= 0.05:
            flags.append(f"Allocation drift in {asset_class}: {d:.1%}")

    if len(tax_candidates) >= 3:
        flags.append(
            f"{len(tax_candidates)} tax-loss harvesting opportunities identified"
        )
    elif len(tax_candidates) > 0:
        tickers_str = ", ".join(c["ticker"] for c in tax_candidates)
        flags.append(f"Tax-loss candidates: {tickers_str}")

    return flags


# ---------------------------------------------------------------------------
# Node function
# ---------------------------------------------------------------------------


async def portfolio_analyzer_node(state: WealthAgentState) -> dict[str, Any]:
    """LangGraph node: Portfolio Analyzer.

    Reads the client's holdings from the database, runs all analytics
    functions, and returns a partial state update containing a fully
    populated :class:`PortfolioAnalysis`.

    Args:
        state: Current shared WealthAgentState flowing through the graph.

    Returns:
        Partial state dict with keys ``current_agent``, ``portfolio_analysis``,
        and (on failure) ``error``.
    """
    result: dict[str, Any] = {"current_agent": "portfolio_analyzer"}

    client_id: str = state.get("client_id", "")
    if not client_id:
        logger.error("portfolio_analyzer: missing client_id in state")
        result["error"] = "portfolio_analyzer: missing client_id in state"
        result["portfolio_analysis"] = None
        return result

    # -----------------------------------------------------------------------
    # Step 1 — Load portfolio + holdings from database
    # -----------------------------------------------------------------------
    try:
        async with AsyncSessionLocal() as session:
            # Load client name
            client_row = await session.execute(
                select(Client).where(Client.id == client_id)
            )
            client_obj = client_row.scalar_one_or_none()
            if client_obj:
                result["client_name"] = client_obj.name

            stmt = (
                select(Portfolio)
                .where(Portfolio.client_id == client_id)
                .options(joinedload(Portfolio.holdings))
            )
            row = await session.execute(stmt)
            portfolio = row.scalars().first()
    except Exception as exc:
        logger.error("DB query failed for client %s: %s", client_id, exc)
        result["error"] = f"portfolio_analyzer: database error — {exc}"
        result["portfolio_analysis"] = None
        return result

    if portfolio is None:
        logger.warning("No portfolio found for client_id=%s", client_id)
        result["error"] = f"portfolio_analyzer: no portfolio found for client {client_id}"
        result["portfolio_analysis"] = None
        return result

    # Parse target allocation (JSON string → dict)
    try:
        target_alloc: dict[str, float] = json.loads(portfolio.target_allocation)
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Could not parse target_allocation for portfolio %s: %s", portfolio.id, exc)
        target_alloc = {}

    # Convert DB Holding rows → analytics Holding dataclasses
    analytics_holdings: list[AnalyticsHolding] = []
    for dbh in portfolio.holdings:
        try:
            purchase_date = datetime.date.fromisoformat(dbh.purchase_date)
        except (ValueError, TypeError):
            purchase_date = datetime.date.today()

        analytics_holdings.append(
            AnalyticsHolding(
                ticker=dbh.ticker,
                shares=float(dbh.shares),
                cost_basis=float(dbh.cost_basis),
                asset_class=dbh.asset_class,
                sector=dbh.sector,
                purchase_date=purchase_date,
            )
        )

    if not analytics_holdings:
        result["portfolio_analysis"] = PortfolioAnalysis(
            summary="No holdings found in this portfolio.",
            total_value=0.0,
            metrics=PortfolioMetrics(total_value=0.0, total_return_pct=0.0),
            allocation=AllocationBreakdown(current={}, target=target_alloc, drift={}),
            sector_breakdown={},
            rebalancing_trades=[],
            tax_loss_candidates=[],
            risk_flags=["Portfolio contains no holdings"],
        )
        return result

    # -----------------------------------------------------------------------
    # Step 2 — Fetch current prices in thread pool (non-blocking)
    # -----------------------------------------------------------------------
    tickers = list({h.ticker for h in analytics_holdings})
    loop = asyncio.get_event_loop()

    try:
        prices: dict[str, float] = await loop.run_in_executor(
            None, _sync_get_prices, tickers
        )
    except Exception as exc:
        logger.error("Price fetch failed for client %s: %s", client_id, exc)
        prices = {}

    # -----------------------------------------------------------------------
    # Step 3 — Basic portfolio metrics (no history required)
    # -----------------------------------------------------------------------
    port_value = total_portfolio_value(analytics_holdings, prices=prices)
    port_return = total_return(analytics_holdings, prices=prices)
    curr_alloc = current_allocation(analytics_holdings, prices=prices)
    sectors = sector_breakdown(analytics_holdings, prices=prices)

    metrics: PortfolioMetrics = {
        "total_value": port_value,
        "total_return_pct": port_return,
    }

    # -----------------------------------------------------------------------
    # Step 4 — Time-series metrics via 1-year daily returns
    # -----------------------------------------------------------------------
    try:
        # Per-holding portfolio weights (fraction of current market value)
        if port_value > 0:
            holding_values = {
                h.ticker: h.shares * prices.get(h.ticker, 0.0)
                for h in analytics_holdings
            }
            weights = {t: v / port_value for t, v in holding_values.items() if v > 0}
        else:
            weights = {}

        # Download 1yr history for all holdings + benchmark
        fetch_tickers = list(set(tickers + [_BENCHMARK_TICKER]))
        close_df: pd.DataFrame = await loop.run_in_executor(
            None, _sync_fetch_history, fetch_tickers, _HISTORY_PERIOD
        )

        if not close_df.empty and weights:
            port_rets_series = _weighted_portfolio_returns(close_df, weights)
            port_rets = list(port_rets_series)

            if len(port_rets) >= 2:
                metrics["sharpe_ratio"] = sharpe_ratio(port_rets)
                metrics["sortino_ratio"] = sortino_ratio(port_rets)
                metrics["max_drawdown"] = max_drawdown(port_rets)
                metrics["annualized_volatility"] = annualized_volatility(port_rets)

                # Beta vs benchmark
                aligned_port, aligned_bench = _align_portfolio_and_benchmark(
                    close_df, weights, _BENCHMARK_TICKER
                )
                if len(aligned_port) >= 2:
                    metrics["beta"] = compute_beta(aligned_port, aligned_bench)

    except Exception as exc:
        logger.warning(
            "Time-series metrics failed for client %s: %s", client_id, exc
        )
        # Continue with partial metrics — not a fatal error

    # -----------------------------------------------------------------------
    # Step 5 — Rebalancing trades + allocation drift
    # -----------------------------------------------------------------------
    state_trades: list[StateRebalancingTrade] = []
    drift: dict[str, float] = {}

    try:
        analytics_trades = rebalancing_trades(
            analytics_holdings, target_alloc, prices=prices
        )
        state_trades = [
            StateRebalancingTrade(
                ticker=t.ticker,
                action=t.action.upper(),
                shares=t.shares,
                estimated_value=t.value,
                reason=f"Rebalance {t.asset_class} allocation",
            )
            for t in analytics_trades
        ]
        if curr_alloc and target_alloc:
            drift = allocation_drift(curr_alloc, target_alloc)
    except Exception as exc:
        logger.warning("Rebalancing computation failed for client %s: %s", client_id, exc)

    # -----------------------------------------------------------------------
    # Step 6 — Tax-loss harvesting candidates
    # -----------------------------------------------------------------------
    state_tax_candidates: list[StateTaxLossCandidate] = []

    try:
        analytics_candidates = tax_loss_candidates(analytics_holdings, prices=prices)
        state_tax_candidates = [
            StateTaxLossCandidate(
                ticker=c.ticker,
                unrealized_return_pct=round(c.unrealized_return * 100.0, 2),
                unrealized_loss_usd=round(c.unrealized_loss, 2),
                suggested_swap=None,  # populated by Market Research agent
            )
            for c in analytics_candidates
        ]
    except Exception as exc:
        logger.warning("Tax-loss computation failed for client %s: %s", client_id, exc)

    # -----------------------------------------------------------------------
    # Step 7 — Assemble PortfolioAnalysis
    # -----------------------------------------------------------------------
    risk_flags = _build_risk_flags(metrics, drift, state_tax_candidates)

    total_val_str = f"${port_value:,.0f}" if port_value else "N/A"
    ret_pct_str = f"{port_return:+.1%}" if port_return else "N/A"
    summary = (
        f"Portfolio of {len(analytics_holdings)} holdings valued at {total_val_str} "
        f"(total return: {ret_pct_str}). "
        f"{len(state_trades)} rebalancing trade(s) suggested; "
        f"{len(state_tax_candidates)} tax-loss opportunity(ies) identified."
    )

    portfolio_analysis: PortfolioAnalysis = {
        "summary": summary,
        "total_value": port_value,
        "metrics": metrics,
        "allocation": AllocationBreakdown(
            current=curr_alloc,
            target=target_alloc,
            drift=drift,
        ),
        "sector_breakdown": sectors,
        "rebalancing_trades": state_trades,
        "tax_loss_candidates": state_tax_candidates,
        "risk_flags": risk_flags,
    }

    result["portfolio_analysis"] = portfolio_analysis
    logger.info(
        "portfolio_analyzer: completed for client %s — value=%s, flags=%d",
        client_id,
        total_val_str,
        len(risk_flags),
    )
    return result
