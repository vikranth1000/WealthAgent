"""Market Research Agent — LangGraph node.

Fetches recent news, macro indicators, and sector performance for a client's
portfolio tickers. All yfinance calls are wrapped in try/except and backed by
a 1-hour in-process cache (same pattern as analytics/portfolio.py).
"""

import asyncio
import datetime
import logging
import time
from collections import Counter
from typing import Optional

import pandas as pd
import yfinance as yf
from sqlalchemy import select

from agents.state import MarketResearch, WealthAgentState
from data.database import AsyncSessionLocal
from data.models import Holding as HoldingModel
from data.models import Portfolio

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-process cache (1-hour TTL — mirrors _price_cache in analytics/portfolio.py)
# ---------------------------------------------------------------------------

_CACHE_TTL: float = 3600.0

# ticker -> (list[dict], monotonic_timestamp)
_news_cache: dict[str, tuple[list[dict], float]] = {}

# fixed key "macro" -> (dict, monotonic_timestamp)
_macro_cache: dict[str, tuple[dict, float]] = {}

# "sector_{period}" -> (dict[str, float], monotonic_timestamp)
_sector_cache: dict[str, tuple[dict[str, float], float]] = {}

# ---------------------------------------------------------------------------
# Sector ETF → human-readable name
# ---------------------------------------------------------------------------

_SECTOR_ETFS: dict[str, str] = {
    "XLK": "Technology",
    "XLV": "Healthcare",
    "XLF": "Financials",
    "XLE": "Energy",
    "XLP": "Consumer Staples",
    "XLI": "Industrials",
    "XLB": "Materials",
    "XLU": "Utilities",
    "XLRE": "Real Estate",
    "XLC": "Communication Services",
}

# ---------------------------------------------------------------------------
# Tool: fetch_ticker_news
# ---------------------------------------------------------------------------


def fetch_ticker_news(tickers: list[str], days: int = 7) -> list[dict]:
    """Fetch recent news headlines for the given tickers via yfinance.

    Uses a per-ticker 1-hour in-process cache. Items older than `days` days
    are excluded from the returned list.

    Args:
        tickers: Portfolio ticker symbols to look up.
        days: Maximum age of news items in days (default 7).

    Returns:
        List of dicts with keys: ticker, headline, source, link, published_at.
        An empty list is returned if all fetches fail.
    """
    cutoff_unix = time.time() - days * 86_400
    now = time.monotonic()
    results: list[dict] = []

    for ticker in tickers:
        # --- Cache hit ---
        if ticker in _news_cache:
            cached_items, cached_at = _news_cache[ticker]
            if now - cached_at < _CACHE_TTL:
                for item in cached_items:
                    if item.get("_raw_ts", 0) >= cutoff_unix:
                        results.append({k: v for k, v in item.items() if k != "_raw_ts"})
                continue

        # --- Cache miss: fetch from yfinance ---
        try:
            raw_news: list[dict] = yf.Ticker(ticker).news or []
            parsed: list[dict] = []

            for item in raw_news:
                # yfinance ≥0.2.50 nests data under a "content" key
                if "content" in item and isinstance(item["content"], dict):
                    content = item["content"]
                    headline = content.get("title", "")
                    link = (
                        content.get("canonicalUrl", {}).get("url", "")
                        or content.get("clickThroughUrl", {}).get("url", "")
                    )
                    source = content.get("provider", {}).get("displayName", "")
                    pub_ts: float = 0.0
                    pub_str: str = content.get("pubDate", "")
                    if pub_str:
                        try:
                            dt = datetime.datetime.fromisoformat(
                                pub_str.replace("Z", "+00:00")
                            )
                            pub_ts = dt.timestamp()
                        except (ValueError, AttributeError):
                            pass
                else:
                    # Legacy flat schema
                    headline = item.get("title", "")
                    link = item.get("link", "") or item.get("url", "")
                    source = item.get("publisher", "") or item.get("source", "")
                    pub_ts = float(item.get("providerPublishTime", 0))

                if not headline:
                    continue

                published_at = (
                    datetime.datetime.utcfromtimestamp(pub_ts).strftime(
                        "%Y-%m-%d %H:%M UTC"
                    )
                    if pub_ts
                    else ""
                )
                parsed.append(
                    {
                        "ticker": ticker,
                        "headline": headline,
                        "source": source,
                        "link": link,
                        "published_at": published_at,
                        "_raw_ts": pub_ts,  # stripped before returning
                    }
                )

            _news_cache[ticker] = (parsed, now)

            for item in parsed:
                if item.get("_raw_ts", 0) >= cutoff_unix:
                    results.append({k: v for k, v in item.items() if k != "_raw_ts"})

        except Exception as exc:
            logger.error("fetch_ticker_news: failed for %s — %s", ticker, exc)

    return results


# ---------------------------------------------------------------------------
# Tool: get_macro_indicators
# ---------------------------------------------------------------------------


def get_macro_indicators() -> dict:
    """Fetch key macro indicators via yfinance.

    Tickers used:
        ^TNX — US 10-year Treasury yield (%)
        ^IRX — US 3-month T-bill yield (%)
        SPY  — S&P 500 proxy (used for YTD return calculation)

    Uses a 1-hour cache under the key "macro".

    Returns:
        Dict with keys:
            treasury_10yr (float | None): 10-year yield in percent.
            treasury_3mo  (float | None): 3-month yield in percent.
            sp500_ytd_return (float | None): S&P 500 YTD return in percent.
            commentary (str): One-line human-readable macro summary.
    """
    cache_key = "macro"
    now = time.monotonic()

    if cache_key in _macro_cache:
        cached_data, cached_at = _macro_cache[cache_key]
        if now - cached_at < _CACHE_TTL:
            return cached_data

    result: dict = {
        "treasury_10yr": None,
        "treasury_3mo": None,
        "sp500_ytd_return": None,
        "commentary": "",
    }

    # 10-year Treasury yield
    try:
        hist = yf.Ticker("^TNX").history(period="5d")
        if not hist.empty:
            result["treasury_10yr"] = round(float(hist["Close"].iloc[-1]), 3)
    except Exception as exc:
        logger.error("get_macro_indicators: ^TNX fetch failed — %s", exc)

    # 3-month T-bill yield
    try:
        hist = yf.Ticker("^IRX").history(period="5d")
        if not hist.empty:
            result["treasury_3mo"] = round(float(hist["Close"].iloc[-1]), 3)
    except Exception as exc:
        logger.error("get_macro_indicators: ^IRX fetch failed — %s", exc)

    # S&P 500 YTD return
    try:
        hist = yf.Ticker("SPY").history(period="ytd")
        if not hist.empty and len(hist) >= 2:
            first = float(hist["Close"].iloc[0])
            last = float(hist["Close"].iloc[-1])
            if first > 0:
                result["sp500_ytd_return"] = round((last - first) / first * 100, 2)
    except Exception as exc:
        logger.error("get_macro_indicators: SPY YTD fetch failed — %s", exc)

    result["commentary"] = _build_macro_commentary(
        result["treasury_10yr"],
        result["treasury_3mo"],
        result["sp500_ytd_return"],
    )

    _macro_cache[cache_key] = (result, now)
    return result


def _build_macro_commentary(
    t10yr: Optional[float],
    t3mo: Optional[float],
    sp500_ytd: Optional[float],
) -> str:
    """Compose a one-line macro commentary from indicator values.

    Args:
        t10yr: 10-year Treasury yield (%).
        t3mo: 3-month T-bill yield (%).
        sp500_ytd: S&P 500 YTD return (%).

    Returns:
        Human-readable commentary string.
    """
    notes: list[str] = []

    if t10yr is not None and t3mo is not None:
        if t3mo > t10yr:
            notes.append(
                f"Inverted yield curve (3mo {t3mo:.1f}% > 10yr {t10yr:.1f}%) — historical recession indicator."
            )
        elif t10yr > 5.0:
            notes.append(
                f"Elevated 10-year yield at {t10yr:.1f}% continues to pressure equity valuations."
            )
        else:
            notes.append(f"Normal yield curve: 10yr {t10yr:.1f}%, 3mo {t3mo:.1f}%.")
    elif t10yr is not None:
        notes.append(f"10-year Treasury yield: {t10yr:.1f}%.")

    if sp500_ytd is not None:
        if sp500_ytd <= -10:
            notes.append(
                f"S&P 500 is down {abs(sp500_ytd):.1f}% YTD — broad market correction."
            )
        elif sp500_ytd < 0:
            notes.append(f"S&P 500 is down {abs(sp500_ytd):.1f}% YTD.")
        else:
            notes.append(f"S&P 500 is up {sp500_ytd:.1f}% YTD.")

    return " ".join(notes) if notes else "Macro data unavailable."


# ---------------------------------------------------------------------------
# Tool: get_sector_performance
# ---------------------------------------------------------------------------


def get_sector_performance(period: str = "1mo") -> dict[str, float]:
    """Fetch recent total returns for major sector ETFs via yfinance.

    Args:
        period: yfinance-compatible period string (default "1mo").

    Returns:
        Dict mapping sector display name -> return percentage.
        Example: {"Technology": 3.2, "Energy": -1.8, ...}
        Sectors that fail to fetch are omitted from the result.
    """
    cache_key = f"sector_{period}"
    now = time.monotonic()

    if cache_key in _sector_cache:
        cached_data, cached_at = _sector_cache[cache_key]
        if now - cached_at < _CACHE_TTL:
            return cached_data

    etfs = list(_SECTOR_ETFS.keys())
    result: dict[str, float] = {}

    try:
        data = yf.download(etfs, period=period, progress=False, auto_adjust=True)
        if data.empty:
            logger.warning("get_sector_performance: empty response from yfinance")
            return result

        close = data["Close"]

        # Guard: yf.download with a single ticker returns a Series
        if isinstance(close, pd.Series):
            etf = etfs[0]
            series = close.dropna()
            if len(series) >= 2:
                ret = (float(series.iloc[-1]) - float(series.iloc[0])) / float(series.iloc[0]) * 100
                result[_SECTOR_ETFS[etf]] = round(ret, 2)
        else:
            for etf, sector_name in _SECTOR_ETFS.items():
                if etf not in close.columns:
                    continue
                series = close[etf].dropna()
                if len(series) < 2:
                    continue
                first = float(series.iloc[0])
                last = float(series.iloc[-1])
                if first > 0:
                    result[sector_name] = round((last - first) / first * 100, 2)

    except Exception as exc:
        logger.error("get_sector_performance: fetch failed — %s", exc)

    _sector_cache[cache_key] = (result, now)
    return result


# ---------------------------------------------------------------------------
# Risk alert builder
# ---------------------------------------------------------------------------


def _build_risk_alerts(
    sector_trends: dict[str, float],
    macro_outlook: dict,
    portfolio_news: list[dict],
    client_tickers: list[str],
) -> list[str]:
    """Derive risk alert strings from available market data.

    Args:
        sector_trends: Sector name -> 1-month return %.
        macro_outlook: Output of get_macro_indicators().
        portfolio_news: News items returned by fetch_ticker_news().
        client_tickers: Tickers in the client's portfolio.

    Returns:
        List of human-readable risk alert strings. Empty if no alerts.
    """
    alerts: list[str] = []

    t10yr = macro_outlook.get("treasury_10yr")
    t3mo = macro_outlook.get("treasury_3mo")
    sp500_ytd = macro_outlook.get("sp500_ytd_return")

    # Yield curve inversion
    if t10yr is not None and t3mo is not None and t3mo > t10yr:
        alerts.append(
            f"Yield curve inverted (3mo {t3mo:.2f}% > 10yr {t10yr:.2f}%): "
            "historical recession indicator — consider reducing equity duration."
        )

    # Elevated long rates
    if t10yr is not None and t10yr > 5.0:
        alerts.append(
            f"10-year yield at {t10yr:.2f}% — elevated rates historically "
            "compress P/E multiples and pressure fixed-income holdings."
        )

    # Broad market drawdown
    if sp500_ytd is not None and sp500_ytd <= -10:
        alerts.append(
            f"S&P 500 down {abs(sp500_ytd):.1f}% YTD — "
            "broad market correction in progress."
        )

    # Sector drawdowns > 5%
    for sector, ret in sector_trends.items():
        if ret < -5.0:
            alerts.append(
                f"{sector} sector down {abs(ret):.1f}% over the past month."
            )

    # High news volume for a single portfolio ticker (event risk proxy)
    if portfolio_news and client_tickers:
        ticker_counts = Counter(item["ticker"] for item in portfolio_news)
        for ticker, count in ticker_counts.most_common():
            if count >= 5 and ticker in client_tickers:
                alerts.append(
                    f"High news volume for {ticker} ({count} items in 7 days) — "
                    "monitor for material corporate events."
                )

    return alerts


# ---------------------------------------------------------------------------
# DB helper
# ---------------------------------------------------------------------------


async def _get_client_tickers(client_id: str) -> list[str]:
    """Load distinct ticker symbols from all holdings for a given client.

    Args:
        client_id: The client's UUID string.

    Returns:
        Sorted list of unique ticker symbols. Empty list if client has no holdings.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(HoldingModel.ticker)
            .join(Portfolio, HoldingModel.portfolio_id == Portfolio.id)
            .where(Portfolio.client_id == client_id)
        )
        rows = result.scalars().all()
    return sorted(set(rows))


# ---------------------------------------------------------------------------
# LangGraph node
# ---------------------------------------------------------------------------


async def market_research_node(state: WealthAgentState) -> dict:
    """LangGraph node: fetch market research for the active client.

    Reads client_id from state, loads portfolio tickers from the DB, then
    fetches news, macro indicators, and sector performance in a thread pool
    to avoid blocking the event loop. All failures are caught — the node
    always returns a (possibly partial) MarketResearch result.

    Args:
        state: Current WealthAgentState passed in by the LangGraph runtime.

    Returns:
        Partial state update dict with keys:
            current_agent (str): "market_research"
            market_research (MarketResearch): populated research TypedDict.
    """
    client_id: str = state.get("client_id", "")
    logger.info("market_research_node: starting — client_id=%s", client_id)

    # 1. Load tickers from DB
    try:
        tickers = await _get_client_tickers(client_id)
    except Exception as exc:
        logger.error(
            "market_research_node: DB lookup failed for client %s — %s", client_id, exc
        )
        tickers = []

    logger.info(
        "market_research_node: %d ticker(s) found: %s", len(tickers), tickers
    )

    # 2. Fetch data concurrently via thread pool (yfinance is synchronous)
    news_future = asyncio.to_thread(fetch_ticker_news, tickers, 7)
    macro_future = asyncio.to_thread(get_macro_indicators)
    sector_future = asyncio.to_thread(get_sector_performance, "1mo")

    portfolio_news: list[dict]
    macro_outlook: dict
    sector_trends: dict[str, float]

    try:
        portfolio_news = await news_future
    except Exception as exc:
        logger.error("market_research_node: fetch_ticker_news raised — %s", exc)
        portfolio_news = []

    try:
        macro_outlook = await macro_future
    except Exception as exc:
        logger.error("market_research_node: get_macro_indicators raised — %s", exc)
        macro_outlook = {
            "treasury_10yr": None,
            "treasury_3mo": None,
            "sp500_ytd_return": None,
            "commentary": "",
        }

    try:
        sector_trends = await sector_future
    except Exception as exc:
        logger.error("market_research_node: get_sector_performance raised — %s", exc)
        sector_trends = {}

    # 3. Risk alerts
    risk_alerts = _build_risk_alerts(
        sector_trends, macro_outlook, portfolio_news, tickers
    )

    # 4. Summary
    summary = _build_summary(
        macro_outlook, portfolio_news, sector_trends, len(tickers)
    )

    market_research: MarketResearch = {
        "summary": summary,
        "portfolio_news": portfolio_news,
        "macro_outlook": macro_outlook,
        "sector_trends": sector_trends,
        "risk_alerts": risk_alerts,
    }

    logger.info(
        "market_research_node: complete — %d news, %d sectors, %d alerts",
        len(portfolio_news),
        len(sector_trends),
        len(risk_alerts),
    )

    return {
        "current_agent": "market_research",
        "market_research": market_research,
    }


def _build_summary(
    macro_outlook: dict,
    portfolio_news: list[dict],
    sector_trends: dict[str, float],
    ticker_count: int,
) -> str:
    """Compose a brief narrative summary of the market research results.

    Args:
        macro_outlook: Output of get_macro_indicators().
        portfolio_news: News items from fetch_ticker_news().
        sector_trends: Sector returns from get_sector_performance().
        ticker_count: Number of tickers in the client's portfolio.

    Returns:
        A 2–4 sentence summary string.
    """
    parts: list[str] = []

    commentary = macro_outlook.get("commentary", "")
    if commentary:
        parts.append(commentary)

    news_count = len(portfolio_news)
    if news_count > 0:
        parts.append(
            f"Found {news_count} recent news item(s) across {ticker_count} portfolio ticker(s)."
        )
    else:
        parts.append(
            "No recent portfolio-relevant news retrieved." if ticker_count > 0
            else "No portfolio tickers available to scan for news."
        )

    if sector_trends:
        best = max(sector_trends, key=lambda s: sector_trends[s])
        worst = min(sector_trends, key=lambda s: sector_trends[s])
        parts.append(
            f"Sector leaders: {best} ({sector_trends[best]:+.1f}%); "
            f"laggards: {worst} ({sector_trends[worst]:+.1f}%) over the past month."
        )

    return " ".join(parts)
