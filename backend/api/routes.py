"""REST API routes for WealthAgent per PRD §6."""

import json
import logging
import datetime
from typing import Any

import pandas as pd
import yfinance as yf
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from analytics.metrics import (
    annualized_volatility,
    max_drawdown,
    sharpe_ratio,
    sortino_ratio,
)
from analytics.portfolio import (
    Holding as AnalyticsHolding,
    current_allocation,
    get_current_prices,
    sector_breakdown,
    total_portfolio_value,
    total_return,
)
from api.schemas import (
    ChatHistoryResponse,
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    ClientListResponse,
    ClientResponse,
    PortfolioResponse,
)
from data.database import get_db
from data.models import ChatMessage, Client, Holding as HoldingModel, Portfolio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Analysis response model (defined here; schemas.py is not modified this phase)
# ---------------------------------------------------------------------------


class PortfolioAnalysisResponse(BaseModel):
    """Response model for portfolio analytics endpoint."""

    client_id: str
    total_value: float
    total_return: float
    current_allocation: dict[str, float]
    target_allocation: dict[str, float]
    sector_breakdown: dict[str, float]
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    volatility: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_analytics_holding(h: HoldingModel) -> AnalyticsHolding:
    """Convert a SQLAlchemy Holding ORM instance to an AnalyticsHolding dataclass."""
    return AnalyticsHolding(
        ticker=h.ticker,
        shares=h.shares,
        cost_basis=h.cost_basis,
        asset_class=h.asset_class,
        sector=h.sector,
        purchase_date=datetime.date.fromisoformat(h.purchase_date),
    )


def _safe_float(value: float) -> float:
    """Replace inf/nan with 0.0 so the response serialises as valid JSON."""
    if value != value or value == float("inf") or value == float("-inf"):
        return 0.0
    return value


def _build_portfolio_returns(
    holdings: list[AnalyticsHolding],
    prices: dict[str, float],
    port_value: float,
) -> list[float]:
    """Fetch 1-year daily history and compute portfolio-weighted daily returns.

    Args:
        holdings: Analytics holding dataclasses for the portfolio.
        prices: Current price map (ticker -> price).
        port_value: Total current portfolio value in dollars.

    Returns:
        List of daily portfolio return fractions. Empty on any fetch failure.
    """
    tickers = list({h.ticker for h in holdings})
    if not tickers or port_value <= 0.0:
        return []

    try:
        hist = yf.download(tickers, period="1y", progress=False, auto_adjust=True)
        if hist.empty or "Close" not in hist.columns:
            return []

        close: pd.DataFrame = hist["Close"]
        if isinstance(close, pd.Series):
            close = close.to_frame(name=tickers[0])

        daily_pct = close.pct_change().dropna()
        if daily_pct.empty:
            return []

        # Build weight map: (shares × price) / total_value
        weights: dict[str, float] = {}
        for h in holdings:
            price = prices.get(h.ticker, 0.0)
            if price > 0.0:
                weights[h.ticker] = (h.shares * price) / port_value

        port_series = pd.Series(0.0, index=daily_pct.index)
        for ticker, weight in weights.items():
            if ticker in daily_pct.columns:
                port_series = port_series + weight * daily_pct[ticker].fillna(0.0)

        return [float(r) for r in port_series.tolist()]

    except Exception as exc:
        logger.warning("Failed to fetch historical returns: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/clients", response_model=ClientListResponse)
async def list_clients(db: AsyncSession = Depends(get_db)) -> ClientListResponse:
    """Return all clients."""
    result = await db.execute(select(Client))
    clients = result.scalars().all()
    return ClientListResponse(clients=[ClientResponse.model_validate(c) for c in clients])


@router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    """Return a single client by ID."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=404, detail=f"Client {client_id!r} not found")
    return ClientResponse.model_validate(client)


@router.get("/clients/{client_id}/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """Return the portfolio (with eagerly-loaded holdings) for a client."""
    client_result = await db.execute(select(Client).where(Client.id == client_id))
    if client_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Client {client_id!r} not found")

    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.client_id == client_id)
        .options(selectinload(Portfolio.holdings))
    )
    portfolio = result.scalar_one_or_none()
    if portfolio is None:
        raise HTTPException(status_code=404, detail=f"No portfolio found for client {client_id!r}")

    return PortfolioResponse.model_validate(portfolio)


@router.get("/clients/{client_id}/analysis", response_model=PortfolioAnalysisResponse)
async def get_analysis(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> PortfolioAnalysisResponse:
    """Compute and return full portfolio analytics for a client.

    Fetches current prices via yfinance (1-hr cached), then computes total
    value, total return, allocation, sector breakdown, Sharpe, Sortino,
    max drawdown, and annualized volatility from 1-year daily history.
    """
    client_result = await db.execute(select(Client).where(Client.id == client_id))
    if client_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Client {client_id!r} not found")

    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.client_id == client_id)
        .options(selectinload(Portfolio.holdings))
    )
    portfolio = result.scalar_one_or_none()
    if portfolio is None:
        raise HTTPException(status_code=404, detail=f"No portfolio found for client {client_id!r}")

    analytics_holdings = [_to_analytics_holding(h) for h in portfolio.holdings]
    tickers = list({h.ticker for h in analytics_holdings})

    # Fetch prices once and share across all analytics calls
    prices = get_current_prices(tickers)

    port_value = total_portfolio_value(analytics_holdings, prices=prices)
    port_return = total_return(analytics_holdings, prices=prices)
    alloc = current_allocation(analytics_holdings, prices=prices)
    sectors = sector_breakdown(analytics_holdings, prices=prices)
    target_alloc: dict[str, float] = json.loads(portfolio.target_allocation)

    # Compute risk metrics from 1-year daily portfolio returns
    daily_returns = _build_portfolio_returns(analytics_holdings, prices, port_value)

    return PortfolioAnalysisResponse(
        client_id=client_id,
        total_value=port_value,
        total_return=port_return,
        current_allocation=alloc,
        target_allocation=target_alloc,
        sector_breakdown=sectors,
        sharpe_ratio=_safe_float(sharpe_ratio(daily_returns)),
        sortino_ratio=_safe_float(sortino_ratio(daily_returns)),
        max_drawdown=_safe_float(max_drawdown(daily_returns)),
        volatility=_safe_float(annualized_volatility(daily_returns)),
    )


@router.get("/clients/{client_id}/chat-history", response_model=ChatHistoryResponse)
async def get_chat_history(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> ChatHistoryResponse:
    """Return chat messages for a client ordered by timestamp."""
    client_result = await db.execute(select(Client).where(Client.id == client_id))
    if client_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Client {client_id!r} not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.client_id == client_id)
        .order_by(ChatMessage.timestamp)
    )
    messages = result.scalars().all()
    return ChatHistoryResponse(
        messages=[ChatMessageResponse.model_validate(m) for m in messages]
    )


@router.delete("/clients/{client_id}/chat-history", status_code=204)
async def delete_chat_history(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete all chat messages for a client."""
    client_result = await db.execute(select(Client).where(Client.id == client_id))
    if client_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Client {client_id!r} not found")

    await db.execute(delete(ChatMessage).where(ChatMessage.client_id == client_id))
    await db.commit()


# ---------------------------------------------------------------------------
# POST /api/chat — non-streaming fallback
# ---------------------------------------------------------------------------


@router.post("/chat", response_model=ChatResponse)
async def post_chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Non-streaming chat endpoint. Runs the full orchestrator pipeline.

    Args:
        body: ChatRequest with client_id, message, and persona.
        db: Async database session.

    Returns:
        ChatResponse with the assistant's message.
    """
    from agents.orchestrator import run_orchestrator

    # We need client_id from the request — add it to ChatRequest or accept it
    # For now, require client_id in the body
    client_id = getattr(body, "client_id", None)
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id is required")

    client_result = await db.execute(select(Client).where(Client.id == client_id))
    if client_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Client {client_id!r} not found")

    # Load chat history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.client_id == client_id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(20)
    )
    history_msgs = history_result.scalars().all()
    chat_history = [
        {"role": m.role, "content": m.content}
        for m in reversed(history_msgs)
    ]

    # Save user message
    user_msg = ChatMessage(
        client_id=client_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.commit()

    # Run orchestrator
    final_state = await run_orchestrator(
        client_id=client_id,
        query=body.message,
        persona=body.persona,
        chat_history=chat_history,
    )

    # Extract response
    report = final_state.get("client_report")
    response_text = ""
    if report:
        response_text = report.get("executive_summary", "")
    if not response_text:
        response_text = "I'm sorry, I couldn't generate a response. Please try again."

    agent = final_state.get("current_agent")

    # Save assistant message
    assistant_msg = ChatMessage(
        client_id=client_id,
        role="assistant",
        content=response_text,
        agent=agent,
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(message=response_text, agent=agent)
