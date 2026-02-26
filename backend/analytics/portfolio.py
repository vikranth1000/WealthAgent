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


# ---------------------------------------------------------------------------
# Periodic returns (monthly, quarterly, YTD, recent trend)
# ---------------------------------------------------------------------------


def periodic_returns(
    close_df: pd.DataFrame,
    weights: dict[str, float],
) -> dict:
    """Compute time-segmented portfolio returns from daily close prices.

    Uses the same weighted-return approach as the portfolio agent's
    time-series metrics, then resamples into monthly and quarterly buckets.

    Args:
        close_df: DataFrame of adjusted daily close prices (rows = dates,
            columns = tickers). Must have a DatetimeIndex.
        weights: Mapping of ticker to portfolio weight fraction (sums to ~1.0).

    Returns:
        Dict matching the PeriodicReturns TypedDict schema. Returns an empty
        dict if computation fails or data is insufficient.
    """
    if close_df.empty or not weights:
        return {}

    try:
        # Build weighted daily portfolio returns
        available = [t for t in weights if t in close_df.columns]
        if not available:
            return {}

        total_w = sum(weights[t] for t in available)
        if total_w == 0.0:
            return {}

        norm_weights = {t: weights[t] / total_w for t in available}
        daily_rets = close_df[available].pct_change()

        port_rets = pd.Series(0.0, index=daily_rets.index)
        for ticker in available:
            port_rets = port_rets + daily_rets[ticker].fillna(0.0) * norm_weights[ticker]

        port_rets = port_rets.iloc[1:]  # drop first NaN row
        if len(port_rets) < 5:
            return {}

        # Cumulative return series (growth of $1)
        cum = (1 + port_rets).cumprod()

        # --- Monthly returns (last 12 months) ---
        monthly_cum = cum.resample("ME").last()
        monthly_list: list[dict] = []
        for i in range(1, min(len(monthly_cum), 13)):
            end_val = monthly_cum.iloc[-i]
            start_val = monthly_cum.iloc[-i - 1] if i + 1 <= len(monthly_cum) else 1.0
            period_ret = (end_val / start_val) - 1.0
            dt = monthly_cum.index[-i]
            monthly_list.append({
                "period": dt.strftime("%Y-%m"),
                "return_pct": round(float(period_ret), 5),
            })
        monthly_list.reverse()

        # --- Quarterly returns (last 4 quarters) ---
        quarterly_cum = cum.resample("QE").last()
        quarterly_list: list[dict] = []
        for i in range(1, min(len(quarterly_cum), 5)):
            end_val = quarterly_cum.iloc[-i]
            start_val = quarterly_cum.iloc[-i - 1] if i + 1 <= len(quarterly_cum) else 1.0
            period_ret = (end_val / start_val) - 1.0
            dt = quarterly_cum.index[-i]
            q_num = (dt.month - 1) // 3 + 1
            quarterly_list.append({
                "period": f"{dt.year}-Q{q_num}",
                "return_pct": round(float(period_ret), 5),
            })
        quarterly_list.reverse()

        # --- YTD return ---
        year_start = pd.Timestamp(cum.index[-1].year, 1, 1)
        ytd_data = cum[cum.index >= year_start]
        if len(ytd_data) >= 2:
            ytd_return = float((ytd_data.iloc[-1] / ytd_data.iloc[0]) - 1.0)
        else:
            ytd_return = 0.0

        # --- Recent trend (1w, 1m, 3m) ---
        recent: dict[str, float] = {}
        latest = cum.iloc[-1]
        for label, days in [("1w", 5), ("1m", 21), ("3m", 63)]:
            if len(cum) > days:
                recent[label] = round(float((latest / cum.iloc[-days - 1]) - 1.0), 5)

        # --- Best / worst month ---
        best_month: dict = {}
        worst_month: dict = {}
        if monthly_list:
            sorted_months = sorted(monthly_list, key=lambda m: m["return_pct"])
            worst_month = sorted_months[0]
            best_month = sorted_months[-1]

        result: dict = {
            "monthly": monthly_list,
            "quarterly": quarterly_list,
            "ytd": round(ytd_return, 5),
            "recent": recent,
        }
        if best_month:
            result["best_month"] = best_month
        if worst_month:
            result["worst_month"] = worst_month

        return result

    except Exception as exc:
        logger.warning("periodic_returns computation failed: %s", exc)
        return {}
