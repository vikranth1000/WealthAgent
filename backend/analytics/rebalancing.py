"""Pure math: allocation drift and rebalancing trade calculations.

No LLM calls, no DB access, no network I/O.
"""

import logging
from dataclasses import dataclass
from typing import Optional

from analytics.portfolio import Holding, get_current_prices, total_portfolio_value

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Output type
# ---------------------------------------------------------------------------


@dataclass
class RebalancingTrade:
    """A suggested trade to bring the portfolio closer to its target allocation."""

    ticker: str
    asset_class: str
    action: str    # "buy" | "sell"
    shares: float  # number of shares to trade (always positive)
    value: float   # dollar value of the trade (always positive)


# ---------------------------------------------------------------------------
# Analytics functions
# ---------------------------------------------------------------------------


def allocation_drift(
    current: dict[str, float],
    target: dict[str, float],
) -> dict[str, float]:
    """Calculate the absolute drift between current and target allocations.

    Formula: |current[class] − target[class]| for every class present in
    either dict.

    Args:
        current: Current allocation fractions by asset class (0.0–1.0).
        target: Target allocation fractions by asset class (0.0–1.0).

    Returns:
        Dict mapping asset_class -> absolute drift (0.0–1.0).
    """
    all_classes = set(current.keys()) | set(target.keys())
    return {
        cls: abs(current.get(cls, 0.0) - target.get(cls, 0.0))
        for cls in all_classes
    }


def rebalancing_trades(
    holdings: list[Holding],
    target_allocation: dict[str, float],
    prices: Optional[dict[str, float]] = None,
) -> list[RebalancingTrade]:
    """Generate the trades required to reach the target allocation.

    For each asset class that needs to increase or decrease in value,
    trades are distributed proportionally across existing holdings within
    that class (by current market value). For asset classes with no
    current holdings, no buy trade is generated (we don't suggest new
    tickers).

    Args:
        holdings: Current portfolio holdings.
        target_allocation: Target fractions by asset class (should sum to ≈1).
        prices: Optional pre-fetched price map. Fetched via yfinance if None.

    Returns:
        List of RebalancingTrade objects. Empty if portfolio is already balanced
        or no holdings exist.
    """
    if not holdings:
        return []

    if prices is None:
        tickers = list({h.ticker for h in holdings})
        prices = get_current_prices(tickers)

    # --- Compute current values ---
    holding_values: dict[str, float] = {}  # ticker -> current market value
    for h in holdings:
        price = prices.get(h.ticker)
        if price is None:
            logger.warning("No price for %s — skipping in rebalancing", h.ticker)
            continue
        holding_values[h.ticker] = h.shares * price

    portfolio_value = sum(holding_values.values())
    if portfolio_value == 0.0:
        return []

    # Current value by asset class
    class_values: dict[str, float] = {}
    for h in holdings:
        if h.ticker not in holding_values:
            continue
        class_values[h.asset_class] = (
            class_values.get(h.asset_class, 0.0) + holding_values[h.ticker]
        )

    # --- Compute target values and deltas ---
    trades: list[RebalancingTrade] = []

    for asset_class, target_frac in target_allocation.items():
        target_value = target_frac * portfolio_value
        current_value = class_values.get(asset_class, 0.0)
        delta = target_value - current_value  # positive = need to buy

        if abs(delta) < 0.01:  # ignore sub-cent differences
            continue

        # Holdings in this asset class (with known prices)
        class_holdings = [
            h for h in holdings
            if h.asset_class == asset_class and h.ticker in holding_values
        ]

        if not class_holdings:
            # No existing holdings in this class — cannot generate a trade
            logger.info(
                "No holdings in '%s' to trade; skipping %+.2f delta.",
                asset_class, delta,
            )
            continue

        action = "buy" if delta > 0 else "sell"
        abs_delta = abs(delta)

        # Distribute trade proportionally by current market value
        class_total_value = sum(holding_values[h.ticker] for h in class_holdings)

        for h in class_holdings:
            weight = (
                holding_values[h.ticker] / class_total_value
                if class_total_value > 0
                else 1.0 / len(class_holdings)
            )
            trade_value = abs_delta * weight
            price = prices[h.ticker]
            trade_shares = trade_value / price if price > 0 else 0.0

            if trade_shares < 1e-6:
                continue

            trades.append(
                RebalancingTrade(
                    ticker=h.ticker,
                    asset_class=asset_class,
                    action=action,
                    shares=round(trade_shares, 6),
                    value=round(trade_value, 2),
                )
            )

    return trades
