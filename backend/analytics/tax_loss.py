"""Pure math: tax-loss harvesting candidate identification.

No LLM calls, no DB access, no network I/O.
"""

import logging
from dataclasses import dataclass
from typing import Optional

from analytics.portfolio import Holding, get_current_prices

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Output type
# ---------------------------------------------------------------------------


@dataclass
class TaxLossCandidate:
    """A holding with an unrealized loss below a given threshold."""

    ticker: str
    shares: float
    cost_basis_per_share: float
    current_price: float
    unrealized_return: float   # fraction, e.g. -0.25 = -25%
    unrealized_loss: float     # dollar amount (always negative)


# ---------------------------------------------------------------------------
# Analytics function
# ---------------------------------------------------------------------------


def tax_loss_candidates(
    holdings: list[Holding],
    prices: Optional[dict[str, float]] = None,
    threshold: float = -0.05,
) -> list[TaxLossCandidate]:
    """Identify holdings whose unrealized return is below the threshold.

    Unrealized return = (current_price − cost_basis) / cost_basis

    Results are sorted by unrealized_return ascending (largest losses first).

    Args:
        holdings: List of portfolio holdings.
        prices: Optional pre-fetched price map (ticker -> price). If None,
                prices are fetched via yfinance.
        threshold: Maximum unrealized return to qualify (e.g. -0.05 = -5%).
                   Holdings at or above this value are excluded.

    Returns:
        List of TaxLossCandidate objects, sorted by unrealized_return ascending.
    """
    if not holdings:
        return []

    if prices is None:
        tickers = list({h.ticker for h in holdings})
        prices = get_current_prices(tickers)

    candidates: list[TaxLossCandidate] = []

    for h in holdings:
        price = prices.get(h.ticker)
        if price is None:
            logger.warning("No price for %s — skipping tax-loss check", h.ticker)
            continue

        if h.cost_basis == 0.0:
            logger.warning("Zero cost basis for %s — skipping", h.ticker)
            continue

        unrealized_return = (price - h.cost_basis) / h.cost_basis
        if unrealized_return < threshold:
            unrealized_loss = h.shares * (price - h.cost_basis)
            candidates.append(
                TaxLossCandidate(
                    ticker=h.ticker,
                    shares=h.shares,
                    cost_basis_per_share=h.cost_basis,
                    current_price=price,
                    unrealized_return=unrealized_return,
                    unrealized_loss=unrealized_loss,
                )
            )

    candidates.sort(key=lambda c: c.unrealized_return)
    return candidates
