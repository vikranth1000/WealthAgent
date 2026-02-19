"""Pure math: Sharpe ratio, Sortino ratio, max drawdown, beta, annualized volatility.

All functions operate on plain Python lists of periodic returns (e.g. daily).
No LLM calls, no DB access, no network I/O.
"""

import logging
import math
from typing import Sequence

import numpy as np

logger = logging.getLogger(__name__)


def annualized_volatility(
    returns: Sequence[float],
    periods_per_year: int = 252,
) -> float:
    """Calculate annualized volatility (standard deviation of returns).

    Formula: std(returns, ddof=1) × √periods_per_year

    Args:
        returns: Sequence of periodic returns (e.g. daily fractions).
        periods_per_year: Number of periods in a year (252 for daily).

    Returns:
        Annualized volatility as a decimal fraction. Returns 0.0 if fewer
        than 2 observations are provided.
    """
    if len(returns) < 2:
        return 0.0

    arr = np.asarray(returns, dtype=float)
    return float(np.std(arr, ddof=1) * math.sqrt(periods_per_year))


def sharpe_ratio(
    returns: Sequence[float],
    risk_free_rate: float = 0.05,
    periods_per_year: int = 252,
) -> float:
    """Calculate the annualized Sharpe ratio.

    Formula: mean(excess_returns) / std(excess_returns, ddof=1) × √periods_per_year
    where excess_returns[i] = returns[i] − risk_free_rate / periods_per_year

    Args:
        returns: Sequence of periodic returns.
        risk_free_rate: Annualized risk-free rate (e.g. 0.05 = 5%).
        periods_per_year: Number of periods in a year.

    Returns:
        Annualized Sharpe ratio. Returns 0.0 when fewer than 2 returns are
        provided or when excess-return standard deviation is zero.
    """
    if len(returns) < 2:
        return 0.0

    arr = np.asarray(returns, dtype=float)
    periodic_rf = risk_free_rate / periods_per_year
    excess = arr - periodic_rf

    std_excess = float(np.std(excess, ddof=1))
    if std_excess == 0.0:
        return 0.0

    return float(np.mean(excess) / std_excess * math.sqrt(periods_per_year))


def sortino_ratio(
    returns: Sequence[float],
    risk_free_rate: float = 0.05,
    periods_per_year: int = 252,
) -> float:
    """Calculate the annualized Sortino ratio.

    Uses only downside deviations (returns below the periodic risk-free rate)
    in the denominator.

    Formula:
        excess_returns[i] = returns[i] − risk_free_rate / periods_per_year
        downside[i]       = min(excess_returns[i], 0)
        σ_downside        = √mean(downside²) × √periods_per_year
        Sortino           = mean(excess_returns) × periods_per_year / σ_downside

    Args:
        returns: Sequence of periodic returns.
        risk_free_rate: Annualized risk-free rate.
        periods_per_year: Number of periods in a year.

    Returns:
        Annualized Sortino ratio. Returns 0.0 if fewer than 2 returns; returns
        float('inf') when there are no downside observations.
    """
    if len(returns) < 2:
        return 0.0

    arr = np.asarray(returns, dtype=float)
    periodic_rf = risk_free_rate / periods_per_year
    excess = arr - periodic_rf
    downside = np.minimum(excess, 0.0)

    downside_variance = float(np.mean(downside ** 2))
    if downside_variance == 0.0:
        return float("inf")

    downside_std_annualized = math.sqrt(downside_variance) * math.sqrt(periods_per_year)
    annualized_excess = float(np.mean(excess)) * periods_per_year

    return annualized_excess / downside_std_annualized


def max_drawdown(returns: Sequence[float]) -> float:
    """Calculate the maximum peak-to-trough drawdown.

    Builds the cumulative return series starting from 1.0 and finds the
    largest percentage decline from any peak to any subsequent trough.

    Args:
        returns: Sequence of periodic returns.

    Returns:
        Maximum drawdown as a non-positive decimal fraction (e.g. -0.30 = −30%).
        Returns 0.0 for an empty sequence or a sequence with no drawdown.
    """
    if not returns:
        return 0.0

    arr = np.asarray(returns, dtype=float)
    # Prepend 1.0 so the starting NAV is treated as the initial peak.
    cum = np.concatenate([[1.0], np.cumprod(1.0 + arr)])
    running_max = np.maximum.accumulate(cum)
    drawdowns = (cum - running_max) / running_max
    return float(np.min(drawdowns))


def beta(
    portfolio_returns: Sequence[float],
    market_returns: Sequence[float],
) -> float:
    """Calculate portfolio beta relative to the market.

    Formula: Cov(R_portfolio, R_market) / Var(R_market)

    Args:
        portfolio_returns: Sequence of periodic portfolio returns.
        market_returns: Sequence of periodic market returns (same length).

    Returns:
        Beta coefficient. Returns 0.0 if fewer than 2 observations or if
        market return variance is zero.

    Raises:
        ValueError: If portfolio_returns and market_returns have different lengths.
    """
    if len(portfolio_returns) != len(market_returns):
        raise ValueError(
            f"portfolio_returns ({len(portfolio_returns)}) and "
            f"market_returns ({len(market_returns)}) must have the same length."
        )

    if len(portfolio_returns) < 2:
        return 0.0

    p_arr = np.asarray(portfolio_returns, dtype=float)
    m_arr = np.asarray(market_returns, dtype=float)

    market_var = float(np.var(m_arr, ddof=1))
    if market_var < 1e-10:
        logger.warning("Market return variance near zero — beta undefined, returning 0.0")
        return 0.0

    cov_matrix = np.cov(p_arr, m_arr, ddof=1)
    covariance = float(cov_matrix[0, 1])
    return covariance / market_var
