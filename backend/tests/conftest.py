"""Shared pytest fixtures for WealthAgent tests."""

import datetime

import pytest

from analytics.portfolio import Holding


# ---------------------------------------------------------------------------
# Sample holdings (4 tickers, deterministic values)
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_holdings() -> list[Holding]:
    """Four holdings across 3 asset classes with known values.

    AAPL: 100 shares @ $100/share cost → gain at $120 current
    BND:  50  shares @ $80/share  cost → small loss at $75 current
    GLD:  20  shares @ $150/share cost → loss at $140 current
    ARKK: 30  shares @ $60/share  cost → large loss at $45 current
    """
    return [
        Holding(
            ticker="AAPL",
            shares=100.0,
            cost_basis=100.0,
            asset_class="US Equity",
            sector="Technology",
            purchase_date=datetime.date(2022, 1, 3),
        ),
        Holding(
            ticker="BND",
            shares=50.0,
            cost_basis=80.0,
            asset_class="Bond",
            sector="Fixed Income",
            purchase_date=datetime.date(2022, 3, 1),
        ),
        Holding(
            ticker="GLD",
            shares=20.0,
            cost_basis=150.0,
            asset_class="Alternative",
            sector="Commodities",
            purchase_date=datetime.date(2022, 4, 15),
        ),
        Holding(
            ticker="ARKK",
            shares=30.0,
            cost_basis=60.0,
            asset_class="US Equity",
            sector="Technology",
            purchase_date=datetime.date(2022, 6, 1),
        ),
    ]


@pytest.fixture
def sample_prices() -> dict[str, float]:
    """Fixed prices that correspond to sample_holdings.

    AAPL: $120  (+20%)
    BND:  $75   (-6.25%)
    GLD:  $140  (-6.67%)
    ARKK: $45   (-25%)
    """
    return {
        "AAPL": 120.0,
        "BND": 75.0,
        "GLD": 140.0,
        "ARKK": 45.0,
    }


@pytest.fixture
def simple_returns() -> list[float]:
    """A short, hand-crafted daily returns sequence for metric tests."""
    return [0.01, -0.02, 0.03, -0.01, 0.02, -0.015, 0.005]
