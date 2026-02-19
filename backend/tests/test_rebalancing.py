"""Tests for analytics/rebalancing.py."""

import pytest

from analytics.rebalancing import RebalancingTrade, allocation_drift, rebalancing_trades


# ---------------------------------------------------------------------------
# allocation_drift
# ---------------------------------------------------------------------------


def test_allocation_drift_balanced():
    """No drift when current == target."""
    current = {"US Equity": 0.60, "Bond": 0.30, "Cash": 0.10}
    target = {"US Equity": 0.60, "Bond": 0.30, "Cash": 0.10}
    drift = allocation_drift(current, target)
    for cls in drift:
        assert drift[cls] == pytest.approx(0.0, abs=1e-12)


def test_allocation_drift_known_values(sample_holdings, sample_prices):
    """Drift values match expected absolute differences."""
    # Using sample allocation values:
    # US Equity: 13350/19900 ≈ 0.6708
    # Bond: 3750/19900 ≈ 0.1884
    # Alternative: 2800/19900 ≈ 0.1407
    from analytics.portfolio import current_allocation

    current = current_allocation(sample_holdings, prices=sample_prices)
    target = {"US Equity": 0.60, "Bond": 0.30, "Alternative": 0.10}
    drift = allocation_drift(current, target)

    assert drift["US Equity"] == pytest.approx(abs(current["US Equity"] - 0.60), rel=1e-9)
    assert drift["Bond"] == pytest.approx(abs(current["Bond"] - 0.30), rel=1e-9)
    assert drift["Alternative"] == pytest.approx(abs(current["Alternative"] - 0.10), rel=1e-9)


def test_allocation_drift_includes_extra_classes():
    """Classes present in only one of current/target still appear in drift."""
    current = {"US Equity": 0.80, "Bond": 0.20}
    target = {"US Equity": 0.60, "Bond": 0.20, "Cash": 0.20}
    drift = allocation_drift(current, target)
    assert "Cash" in drift
    assert drift["Cash"] == pytest.approx(0.20, rel=1e-9)


def test_allocation_drift_all_positive(sample_holdings, sample_prices):
    """All drift values are non-negative."""
    from analytics.portfolio import current_allocation

    current = current_allocation(sample_holdings, prices=sample_prices)
    target = {"US Equity": 0.50, "Bond": 0.35, "Alternative": 0.15}
    drift = allocation_drift(current, target)
    for val in drift.values():
        assert val >= 0.0


# ---------------------------------------------------------------------------
# rebalancing_trades
# ---------------------------------------------------------------------------


def test_rebalancing_trades_returns_list(sample_holdings, sample_prices):
    """rebalancing_trades returns a list (possibly empty)."""
    target = {"US Equity": 0.60, "Bond": 0.30, "Alternative": 0.10}
    result = rebalancing_trades(sample_holdings, target, prices=sample_prices)
    assert isinstance(result, list)


def test_rebalancing_trades_sell_overweight_class(sample_holdings, sample_prices):
    """US Equity is overweight (67% vs 60% target) → at least one sell trade."""
    target = {"US Equity": 0.60, "Bond": 0.30, "Alternative": 0.10}
    trades = rebalancing_trades(sample_holdings, target, prices=sample_prices)

    us_equity_sells = [t for t in trades if t.asset_class == "US Equity" and t.action == "sell"]
    assert len(us_equity_sells) > 0


def test_rebalancing_trades_buy_underweight_class(sample_holdings, sample_prices):
    """Bond is underweight (18.8% vs 30% target) → at least one buy trade."""
    target = {"US Equity": 0.60, "Bond": 0.30, "Alternative": 0.10}
    trades = rebalancing_trades(sample_holdings, target, prices=sample_prices)

    bond_buys = [t for t in trades if t.asset_class == "Bond" and t.action == "buy"]
    assert len(bond_buys) > 0


def test_rebalancing_trades_trade_values_positive(sample_holdings, sample_prices):
    """All trade values and shares are positive."""
    target = {"US Equity": 0.60, "Bond": 0.30, "Alternative": 0.10}
    trades = rebalancing_trades(sample_holdings, target, prices=sample_prices)
    for t in trades:
        assert t.value > 0
        assert t.shares > 0


def test_rebalancing_trades_already_balanced():
    """A perfectly balanced portfolio generates no trades (or negligible ones)."""
    from analytics.portfolio import Holding

    # 60% / 40% split with exact prices
    holdings = [
        Holding(ticker="A", shares=60, cost_basis=100.0, asset_class="US Equity", sector="Tech"),
        Holding(ticker="B", shares=40, cost_basis=100.0, asset_class="Bond", sector="Fixed Income"),
    ]
    prices = {"A": 100.0, "B": 100.0}
    target = {"US Equity": 0.60, "Bond": 0.40}
    trades = rebalancing_trades(holdings, target, prices=prices)
    # No meaningful trades needed
    for t in trades:
        assert t.value < 0.01  # sub-cent is fine


def test_rebalancing_trades_empty_holdings():
    """Empty holdings list returns an empty list."""
    result = rebalancing_trades([], {"US Equity": 1.0}, prices={})
    assert result == []


def test_rebalancing_trades_ticker_in_holdings(sample_holdings, sample_prices):
    """All trade tickers exist in the holdings."""
    known_tickers = {h.ticker for h in sample_holdings}
    target = {"US Equity": 0.60, "Bond": 0.30, "Alternative": 0.10}
    trades = rebalancing_trades(sample_holdings, target, prices=sample_prices)
    for t in trades:
        assert t.ticker in known_tickers
