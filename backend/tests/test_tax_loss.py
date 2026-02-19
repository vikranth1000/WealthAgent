"""Tests for analytics/tax_loss.py."""

import pytest

from analytics.tax_loss import TaxLossCandidate, tax_loss_candidates


# ---------------------------------------------------------------------------
# Basic identification
# ---------------------------------------------------------------------------


def test_tax_loss_candidates_identifies_losses(sample_holdings, sample_prices):
    """BND, GLD, ARKK have unrealized returns below -5% and should be identified."""
    # BND:  (75 - 80) / 80 = -6.25%
    # GLD:  (140 - 150) / 150 = -6.67%
    # ARKK: (45 - 60) / 60 = -25%
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    tickers = {c.ticker for c in results}
    assert "BND" in tickers
    assert "GLD" in tickers
    assert "ARKK" in tickers


def test_tax_loss_candidates_excludes_gains(sample_holdings, sample_prices):
    """AAPL has a gain (+20%) and must NOT appear in results."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    tickers = {c.ticker for c in results}
    assert "AAPL" not in tickers


def test_tax_loss_candidates_no_losses():
    """Portfolio with no losses returns an empty list."""
    from analytics.portfolio import Holding

    holdings = [
        Holding(ticker="X", shares=10, cost_basis=100.0, asset_class="US Equity", sector="Tech"),
        Holding(ticker="Y", shares=5,  cost_basis=50.0,  asset_class="Bond",      sector="Fixed Income"),
    ]
    prices = {"X": 120.0, "Y": 60.0}
    result = tax_loss_candidates(holdings, prices=prices, threshold=-0.05)
    assert result == []


def test_tax_loss_candidates_empty_holdings():
    """Empty holdings list returns an empty list."""
    assert tax_loss_candidates([]) == []


# ---------------------------------------------------------------------------
# Threshold sensitivity
# ---------------------------------------------------------------------------


def test_tax_loss_strict_threshold(sample_holdings, sample_prices):
    """With threshold=-0.20 only ARKK (-25%) qualifies."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.20)
    tickers = {c.ticker for c in results}
    assert "ARKK" in tickers
    assert "BND" not in tickers
    assert "GLD" not in tickers


def test_tax_loss_loose_threshold(sample_holdings, sample_prices):
    """With threshold=0.0 all holdings with any loss qualify (BND, GLD, ARKK)."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=0.0)
    tickers = {c.ticker for c in results}
    assert "BND" in tickers
    assert "GLD" in tickers
    assert "ARKK" in tickers
    assert "AAPL" not in tickers


# ---------------------------------------------------------------------------
# Computed fields
# ---------------------------------------------------------------------------


def test_tax_loss_unrealized_return_correct(sample_holdings, sample_prices):
    """Unrealized return is (current_price - cost_basis) / cost_basis."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    result_map = {c.ticker: c for c in results}

    # ARKK: (45 - 60) / 60 = -0.25
    assert result_map["ARKK"].unrealized_return == pytest.approx(-0.25, rel=1e-9)
    # BND: (75 - 80) / 80 = -0.0625
    assert result_map["BND"].unrealized_return == pytest.approx(-0.0625, rel=1e-9)
    # GLD: (140 - 150) / 150 ≈ -0.06667
    assert result_map["GLD"].unrealized_return == pytest.approx(-1.0 / 15.0, rel=1e-9)


def test_tax_loss_unrealized_loss_correct(sample_holdings, sample_prices):
    """Unrealized loss = shares × (current_price - cost_basis) and is negative."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    result_map = {c.ticker: c for c in results}

    # ARKK: 30 * (45 - 60) = -450
    assert result_map["ARKK"].unrealized_loss == pytest.approx(-450.0, rel=1e-9)
    # BND: 50 * (75 - 80) = -250
    assert result_map["BND"].unrealized_loss == pytest.approx(-250.0, rel=1e-9)


def test_tax_loss_all_losses_negative(sample_holdings, sample_prices):
    """All unrealized losses in the result are negative dollar amounts."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    for c in results:
        assert c.unrealized_loss < 0


# ---------------------------------------------------------------------------
# Sorting
# ---------------------------------------------------------------------------


def test_tax_loss_sorted_ascending(sample_holdings, sample_prices):
    """Results are sorted by unrealized_return ascending (largest loss first)."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    returns = [c.unrealized_return for c in results]
    assert returns == sorted(returns)


def test_tax_loss_arkk_first(sample_holdings, sample_prices):
    """ARKK has the largest loss (-25%) and should appear first."""
    results = tax_loss_candidates(sample_holdings, prices=sample_prices, threshold=-0.05)
    assert results[0].ticker == "ARKK"
