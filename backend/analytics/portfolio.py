"""Pure math: total portfolio value, total return, current allocation, sector breakdown.

All functions accept an optional `prices` dict to avoid yfinance calls in tests.
yfinance fetches are cached in-process with a 1-hour TTL.
"""

import logging
import time
from dataclasses import dataclass, field
import datetime
from typing import Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared data structure
# ---------------------------------------------------------------------------


@dataclass
class Holding:
    """Represents a single portfolio holding (pure data, no DB dependency)."""

    ticker: str
    shares: float
    cost_basis: float  # per-share cost basis
    asset_class: str   # e.g. "US Equity", "Bond", "Alternative", "Cash", "Intl Equity"
    sector: str        # e.g. "Technology", "Fixed Income", "Commodities"
    purchase_date: datetime.date = field(default_factory=datetime.date.today)


# ---------------------------------------------------------------------------
# Price cache (in-process, 1-hour TTL)
# ---------------------------------------------------------------------------

_CACHE_TTL_SECONDS: float = 3600.0
_price_cache: dict[str, tuple[float, float]] = {}  # ticker -> (price, timestamp)


def _fetch_prices_yfinance(tickers: list[str]) -> dict[str, float]:
    """Batch-fetch latest close prices from yfinance.

    Args:
        tickers: List of ticker symbols.

    Returns:
        Dict mapping ticker -> latest close price. Missing tickers are omitted.
    """
    if not tickers:
        return {}

    try:
        data = yf.download(tickers, period="2d", progress=False, auto_adjust=True)
        if data.empty:
            return {}

        close = data["Close"]

        # Normalize: yf.download with a list always returns DataFrame,
        # but guard against Series in case of version differences.
        if isinstance(close, pd.Series):
            close = close.to_frame(name=tickers[0])

        result: dict[str, float] = {}
        for ticker in tickers:
            if ticker in close.columns:
                series = close[ticker].dropna()
                if not series.empty:
                    result[ticker] = float(series.iloc[-1])

        return result

    except Exception as exc:
        logger.warning("yfinance batch download failed: %s", exc)
        return {}


def get_current_prices(tickers: list[str]) -> dict[str, float]:
    """Return current prices for the given tickers, using the in-process cache.

    Cache TTL is 1 hour. On yfinance failure, stale cache values are returned
    for any ticker that has a cached entry; missing tickers are logged and omitted.

    Args:
        tickers: Ticker symbols to look up.

    Returns:
        Dict mapping ticker -> price for all successfully fetched tickers.
    """
    if not tickers:
        return {}

    now = time.monotonic()
    result: dict[str, float] = {}
    stale: list[str] = []

    for ticker in tickers:
        if ticker in _price_cache:
            price, ts = _price_cache[ticker]
            if now - ts < _CACHE_TTL_SECONDS:
                result[ticker] = price
            else:
                stale.append(ticker)
        else:
            stale.append(ticker)

    if stale:
        fetched = _fetch_prices_yfinance(stale)
        for ticker in stale:
            if ticker in fetched:
                _price_cache[ticker] = (fetched[ticker], now)
                result[ticker] = fetched[ticker]
            elif ticker in _price_cache:
                # Return stale value rather than nothing
                logger.warning("Using stale price for %s", ticker)
                result[ticker] = _price_cache[ticker][0]
            else:
                logger.error("No price available for %s", ticker)

    return result


# ---------------------------------------------------------------------------
# Analytics functions
# ---------------------------------------------------------------------------


def total_portfolio_value(
    holdings: list[Holding],
    prices: Optional[dict[str, float]] = None,
) -> float:
    """Calculate the total current market value of the portfolio.

    Formula: Σ(shares × current_price)

    Args:
        holdings: List of portfolio holdings.
        prices: Optional pre-fetched price map (ticker -> price). If None,
                prices are fetched via yfinance.

    Returns:
        Total portfolio value in dollars. Returns 0.0 for an empty portfolio.
    """
    if not holdings:
        return 0.0

    if prices is None:
        tickers = list({h.ticker for h in holdings})
        prices = get_current_prices(tickers)

    total = 0.0
    for h in holdings:
        price = prices.get(h.ticker)
        if price is None:
            logger.warning("No price for %s — excluding from total value", h.ticker)
            continue
        total += h.shares * price

    return total


def total_return(
    holdings: list[Holding],
    prices: Optional[dict[str, float]] = None,
) -> float:
    """Calculate the total portfolio return as a fraction.

    Formula: (current_value - cost_basis_total) / cost_basis_total

    Args:
        holdings: List of portfolio holdings.
        prices: Optional pre-fetched price map.

    Returns:
        Return as a decimal fraction (e.g. 0.05 = 5%). Returns 0.0 if
        cost basis is zero (avoids division by zero).
    """
    if not holdings:
        return 0.0

    if prices is None:
        tickers = list({h.ticker for h in holdings})
        prices = get_current_prices(tickers)

    current_value = 0.0
    cost_basis_total = 0.0

    for h in holdings:
        price = prices.get(h.ticker)
        if price is None:
            logger.warning("No price for %s — excluding from return calculation", h.ticker)
            continue
        current_value += h.shares * price
        cost_basis_total += h.shares * h.cost_basis

    if cost_basis_total == 0.0:
        return 0.0

    return (current_value - cost_basis_total) / cost_basis_total


def current_allocation(
    holdings: list[Holding],
    prices: Optional[dict[str, float]] = None,
) -> dict[str, float]:
    """Calculate the current allocation by asset class as fractions.

    Args:
        holdings: List of portfolio holdings.
        prices: Optional pre-fetched price map.

    Returns:
        Dict mapping asset_class -> fraction of total portfolio value (0.0–1.0).
        Returns an empty dict for an empty or zero-value portfolio.
    """
    if not holdings:
        return {}

    if prices is None:
        tickers = list({h.ticker for h in holdings})
        prices = get_current_prices(tickers)

    class_values: dict[str, float] = {}
    for h in holdings:
        price = prices.get(h.ticker)
        if price is None:
            continue
        value = h.shares * price
        class_values[h.asset_class] = class_values.get(h.asset_class, 0.0) + value

    total = sum(class_values.values())
    if total == 0.0:
        return {}

    return {cls: val / total for cls, val in class_values.items()}


def sector_breakdown(
    holdings: list[Holding],
    prices: Optional[dict[str, float]] = None,
) -> dict[str, float]:
    """Calculate the current allocation by sector as fractions.

    Args:
        holdings: List of portfolio holdings.
        prices: Optional pre-fetched price map.

    Returns:
        Dict mapping sector -> fraction of total portfolio value (0.0–1.0).
        Returns an empty dict for an empty or zero-value portfolio.
    """
    if not holdings:
        return {}

    if prices is None:
        tickers = list({h.ticker for h in holdings})
        prices = get_current_prices(tickers)

    sector_values: dict[str, float] = {}
    for h in holdings:
        price = prices.get(h.ticker)
        if price is None:
            continue
        value = h.shares * price
        sector_values[h.sector] = sector_values.get(h.sector, 0.0) + value

    total = sum(sector_values.values())
    if total == 0.0:
        return {}

    return {sec: val / total for sec, val in sector_values.items()}
