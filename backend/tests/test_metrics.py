"""Tests for analytics/metrics.py."""

import math

import numpy as np
import pytest

from analytics.metrics import (
    annualized_volatility,
    beta,
    max_drawdown,
    sharpe_ratio,
    sortino_ratio,
)


# ---------------------------------------------------------------------------
# annualized_volatility
# ---------------------------------------------------------------------------


def test_annualized_volatility_constant_returns():
    """Constant returns have zero volatility."""
    returns = [0.01] * 50
    assert annualized_volatility(returns) == pytest.approx(0.0, abs=1e-12)


def test_annualized_volatility_known_value():
    """Volatility matches numpy reference computation."""
    np.random.seed(0)
    returns = list(np.random.normal(0.001, 0.015, 252))
    expected = float(np.std(returns, ddof=1) * math.sqrt(252))
    assert annualized_volatility(returns) == pytest.approx(expected, rel=1e-9)


def test_annualized_volatility_single_return():
    """Single observation returns 0 (cannot compute std)."""
    assert annualized_volatility([0.02]) == 0.0


def test_annualized_volatility_empty():
    """Empty sequence returns 0."""
    assert annualized_volatility([]) == 0.0


def test_annualized_volatility_custom_periods(simple_returns):
    """Custom periods_per_year scales correctly."""
    vol_daily = annualized_volatility(simple_returns, periods_per_year=252)
    vol_monthly = annualized_volatility(simple_returns, periods_per_year=12)
    # Monthly should be smaller than daily-annualized
    assert vol_monthly < vol_daily


# ---------------------------------------------------------------------------
# sharpe_ratio
# ---------------------------------------------------------------------------


def test_sharpe_ratio_known_value():
    """Sharpe ratio matches manual numpy computation."""
    np.random.seed(42)
    returns = list(np.random.normal(0.001, 0.01, 252))
    rf = 0.05
    periods = 252
    periodic_rf = rf / periods
    excess = np.array(returns) - periodic_rf
    expected = float(np.mean(excess) / np.std(excess, ddof=1) * math.sqrt(periods))
    result = sharpe_ratio(returns, risk_free_rate=rf, periods_per_year=periods)
    assert result == pytest.approx(expected, rel=1e-9)


def test_sharpe_ratio_zero_std_returns_zero():
    """When all excess returns are identical, Sharpe returns 0."""
    # All returns equal risk-free → excess std = 0
    rf = 0.05
    daily_rf = rf / 252
    returns = [daily_rf] * 252
    assert sharpe_ratio(returns, risk_free_rate=rf) == 0.0


def test_sharpe_ratio_positive_for_good_returns():
    """Returns well above risk-free rate yield a positive Sharpe."""
    returns = [0.005] * 100 + [-0.002] * 100  # mean positive excess
    result = sharpe_ratio(returns, risk_free_rate=0.05)
    # Mean daily return ≈ 0.0015, rf daily ≈ 0.000198 → positive excess
    assert result > 0


def test_sharpe_ratio_empty():
    """Empty returns sequence returns 0."""
    assert sharpe_ratio([]) == 0.0


def test_sharpe_ratio_single_observation():
    """Single observation returns 0."""
    assert sharpe_ratio([0.01]) == 0.0


# ---------------------------------------------------------------------------
# sortino_ratio
# ---------------------------------------------------------------------------


def test_sortino_ratio_known_value():
    """Sortino ratio matches manual computation."""
    np.random.seed(7)
    returns = list(np.random.normal(0.001, 0.01, 500))
    rf = 0.04
    periods = 252
    periodic_rf = rf / periods
    excess = np.array(returns) - periodic_rf
    downside = np.minimum(excess, 0.0)
    downside_std_ann = math.sqrt(float(np.mean(downside ** 2))) * math.sqrt(periods)
    expected = float(np.mean(excess)) * periods / downside_std_ann
    result = sortino_ratio(returns, risk_free_rate=rf, periods_per_year=periods)
    assert result == pytest.approx(expected, rel=1e-9)


def test_sortino_ratio_no_downside_returns_inf():
    """No downside observations → Sortino is infinity."""
    returns = [0.01, 0.02, 0.03, 0.015]  # all above daily rf ≈ 0.000198
    result = sortino_ratio(returns, risk_free_rate=0.05)
    assert math.isinf(result)


def test_sortino_ratio_empty():
    """Empty returns sequence returns 0."""
    assert sortino_ratio([]) == 0.0


def test_sortino_ratio_single():
    """Single observation returns 0."""
    assert sortino_ratio([0.01]) == 0.0


def test_sortino_gte_sharpe_for_same_returns(simple_returns):
    """Sortino ≥ Sharpe when there are downside returns (Sortino penalises only downside)."""
    s = sharpe_ratio(simple_returns)
    so = sortino_ratio(simple_returns)
    # Both finite in this case; Sortino should be >= Sharpe
    assert so >= s


# ---------------------------------------------------------------------------
# max_drawdown
# ---------------------------------------------------------------------------


def test_max_drawdown_known_sequence():
    """Hand-computed max drawdown: -30% for a peak at 1.32 → trough at 0.924."""
    returns = [0.10, 0.20, -0.30, 0.50, -0.10]
    # cumret: 1.10, 1.32, 0.924, 1.386, 1.2474
    # running_max: 1.10, 1.32, 1.32, 1.386, 1.386
    # drawdown at idx 2: (0.924 - 1.32) / 1.32 = -0.30
    result = max_drawdown(returns)
    assert result == pytest.approx(-0.30, rel=1e-6)


def test_max_drawdown_all_positive_returns():
    """No drawdown when every return is positive."""
    returns = [0.01, 0.02, 0.03, 0.005, 0.015]
    assert max_drawdown(returns) == pytest.approx(0.0, abs=1e-12)


def test_max_drawdown_empty():
    """Empty returns sequence returns 0."""
    assert max_drawdown([]) == 0.0


def test_max_drawdown_single_negative():
    """Single negative return is its own drawdown."""
    result = max_drawdown([-0.15])
    assert result == pytest.approx(-0.15, rel=1e-9)


def test_max_drawdown_non_positive():
    """Max drawdown is always ≤ 0."""
    np.random.seed(1)
    returns = list(np.random.normal(0.0, 0.02, 252))
    assert max_drawdown(returns) <= 0.0


# ---------------------------------------------------------------------------
# beta
# ---------------------------------------------------------------------------


def test_beta_vs_itself():
    """Beta of a portfolio against itself is 1.0."""
    returns = [0.01, -0.02, 0.03, -0.01, 0.02, 0.005, -0.015]
    result = beta(returns, returns)
    assert result == pytest.approx(1.0, rel=1e-9)


def test_beta_double_market():
    """Portfolio = 2× market → beta = 2."""
    market = [0.01, -0.02, 0.03, -0.01, 0.02, 0.005, -0.015]
    portfolio = [2.0 * r for r in market]
    result = beta(portfolio, market)
    assert result == pytest.approx(2.0, rel=1e-9)


def test_beta_zero_correlation():
    """Constant portfolio vs varying market → beta = 0."""
    market = [0.01, -0.02, 0.03, -0.01, 0.02, 0.005, -0.015]
    portfolio = [0.001] * len(market)  # constant → zero covariance
    result = beta(portfolio, market)
    assert result == pytest.approx(0.0, abs=1e-10)


def test_beta_zero_market_variance_returns_zero():
    """Zero market variance → beta returns 0.0 gracefully."""
    market = [0.01] * 10  # constant market
    portfolio = [0.02] * 10
    result = beta(portfolio, market)
    assert result == 0.0


def test_beta_mismatched_lengths_raises():
    """Mismatched return sequence lengths raise ValueError."""
    with pytest.raises(ValueError):
        beta([0.01, 0.02], [0.01, 0.02, 0.03])


def test_beta_known_value():
    """Beta matches numpy reference computation."""
    np.random.seed(99)
    market = list(np.random.normal(0.001, 0.01, 252))
    portfolio = [1.3 * r + np.random.normal(0, 0.003) for r in market]
    p_arr = np.array(portfolio)
    m_arr = np.array(market)
    cov_mat = np.cov(p_arr, m_arr, ddof=1)
    expected = cov_mat[0, 1] / np.var(m_arr, ddof=1)
    result = beta(portfolio, market)
    assert result == pytest.approx(expected, rel=1e-9)
