"""Tests for analytics/portfolio.py."""

import pytest

from analytics.portfolio import (
    Holding,
    current_allocation,
    sector_breakdown,
    total_portfolio_value,
    total_return,
)


# ---------------------------------------------------------------------------
# total_portfolio_value
# ---------------------------------------------------------------------------


def test_total_portfolio_value_basic(sample_holdings, sample_prices):
    """Total value = Σ(shares × price)."""
    # AAPL: 100*120=12000, BND: 50*75=3750, GLD: 20*140=2800, ARKK: 30*45=1350
    expected = 100 * 120 + 50 * 75 + 20 * 140 + 30 * 45
    result = total_portfolio_value(sample_holdings, prices=sample_prices)
    assert result == pytest.approx(expected, rel=1e-9)


def test_total_portfolio_value_empty():
    """Empty holdings list returns 0."""
    assert total_portfolio_value([]) == 0.0


def test_total_portfolio_value_single(sample_holdings, sample_prices):
    """Single holding."""
    single = [sample_holdings[0]]  # AAPL: 100 * 120 = 12000
    assert total_portfolio_value(single, prices=sample_prices) == pytest.approx(12000.0)


def test_total_portfolio_value_skips_missing_price(sample_holdings):
    """Holdings with missing prices are excluded from the total."""
    prices = {"AAPL": 120.0}  # Only one price provided
    result = total_portfolio_value(sample_holdings, prices=prices)
    assert result == pytest.approx(12000.0)


# ---------------------------------------------------------------------------
# total_return
# ---------------------------------------------------------------------------


def test_total_return_mixed_gains_losses(sample_holdings, sample_prices):
    """Return = (current - cost_basis) / cost_basis for the whole portfolio."""
    # current: 12000 + 3750 + 2800 + 1350 = 19900
    # cost:    10000 + 4000 + 3000 + 1800 = 18800
    # return:  (19900 - 18800) / 18800 = 1100/18800
    expected = 1100.0 / 18800.0
    result = total_return(sample_holdings, prices=sample_prices)
    assert result == pytest.approx(expected, rel=1e-9)


def test_total_return_all_gain():
    """Portfolio with only gains returns a positive fraction."""
    from analytics.portfolio import Holding
    holdings = [Holding(ticker="X", shares=10, cost_basis=100.0, asset_class="US Equity", sector="Tech")]
    prices = {"X": 150.0}
    result = total_return(holdings, prices=prices)
    assert result == pytest.approx(0.5, rel=1e-9)


def test_total_return_all_loss():
    """Portfolio with only losses returns a negative fraction."""
    from analytics.portfolio import Holding
    holdings = [Holding(ticker="X", shares=10, cost_basis=100.0, asset_class="US Equity", sector="Tech")]
    prices = {"X": 80.0}
    result = total_return(holdings, prices=prices)
    assert result == pytest.approx(-0.20, rel=1e-9)


def test_total_return_empty():
    """Empty portfolio returns 0."""
    assert total_return([]) == 0.0


def test_total_return_zero_cost_basis():
    """Zero cost basis returns 0 to avoid division by zero."""
    from analytics.portfolio import Holding
    holdings = [Holding(ticker="X", shares=10, cost_basis=0.0, asset_class="US Equity", sector="Tech")]
    prices = {"X": 100.0}
    assert total_return(holdings, prices=prices) == 0.0


# ---------------------------------------------------------------------------
# current_allocation
# ---------------------------------------------------------------------------


def test_current_allocation_fractions_sum_to_one(sample_holdings, sample_prices):
    """All allocation fractions must sum to 1."""
    alloc = current_allocation(sample_holdings, prices=sample_prices)
    assert sum(alloc.values()) == pytest.approx(1.0, rel=1e-9)


def test_current_allocation_asset_classes(sample_holdings, sample_prices):
    """Allocation keys match the asset classes in holdings."""
    alloc = current_allocation(sample_holdings, prices=sample_prices)
    assert "US Equity" in alloc
    assert "Bond" in alloc
    assert "Alternative" in alloc


def test_current_allocation_values(sample_holdings, sample_prices):
    """Allocation fractions match expected values."""
    # total = 19900
    # US Equity: 12000 + 1350 = 13350 → 13350/19900
    # Bond:      3750 → 3750/19900
    # Alternative: 2800 → 2800/19900
    total = 19900.0
    alloc = current_allocation(sample_holdings, prices=sample_prices)
    assert alloc["US Equity"] == pytest.approx(13350.0 / total, rel=1e-6)
    assert alloc["Bond"] == pytest.approx(3750.0 / total, rel=1e-6)
    assert alloc["Alternative"] == pytest.approx(2800.0 / total, rel=1e-6)


def test_current_allocation_empty():
    """Empty holdings returns empty dict."""
    assert current_allocation([]) == {}


# ---------------------------------------------------------------------------
# sector_breakdown
# ---------------------------------------------------------------------------


def test_sector_breakdown_fractions_sum_to_one(sample_holdings, sample_prices):
    """Sector fractions must sum to 1."""
    breakdown = sector_breakdown(sample_holdings, prices=sample_prices)
    assert sum(breakdown.values()) == pytest.approx(1.0, rel=1e-9)


def test_sector_breakdown_values(sample_holdings, sample_prices):
    """Sector breakdown fractions match expected values."""
    # Technology: AAPL + ARKK = 12000 + 1350 = 13350
    # Fixed Income: BND = 3750
    # Commodities: GLD = 2800
    # total = 19900
    total = 19900.0
    breakdown = sector_breakdown(sample_holdings, prices=sample_prices)
    assert breakdown["Technology"] == pytest.approx(13350.0 / total, rel=1e-6)
    assert breakdown["Fixed Income"] == pytest.approx(3750.0 / total, rel=1e-6)
    assert breakdown["Commodities"] == pytest.approx(2800.0 / total, rel=1e-6)


def test_sector_breakdown_empty():
    """Empty holdings returns empty dict."""
    assert sector_breakdown([]) == {}
