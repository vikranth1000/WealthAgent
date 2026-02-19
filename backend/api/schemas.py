"""Pydantic v2 schemas for WealthAgent API request/response models."""

import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Client schemas
# ---------------------------------------------------------------------------


class ClientResponse(BaseModel):
    """Client profile returned by the API."""

    id: str
    name: str
    persona: str
    risk_tolerance: int
    investment_goals: list[str]

    @field_validator("investment_goals", mode="before")
    @classmethod
    def parse_investment_goals(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = {"from_attributes": True}


class ClientListResponse(BaseModel):
    clients: list[ClientResponse]


# ---------------------------------------------------------------------------
# Holding schemas
# ---------------------------------------------------------------------------


class HoldingResponse(BaseModel):
    id: str
    portfolio_id: str
    ticker: str
    shares: float
    cost_basis: float
    purchase_date: str
    asset_class: str
    sector: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Portfolio schemas
# ---------------------------------------------------------------------------


class PortfolioResponse(BaseModel):
    id: str
    client_id: str
    name: str
    target_allocation: dict[str, float]
    holdings: list[HoldingResponse]

    @field_validator("target_allocation", mode="before")
    @classmethod
    def parse_target_allocation(cls, v: Any) -> dict[str, float]:
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Chat schemas
# ---------------------------------------------------------------------------


class ChatMessageResponse(BaseModel):
    id: str
    client_id: str
    role: str
    content: str
    agent: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    client_id: str
    message: str
    persona: str


class ChatResponse(BaseModel):
    message: str
    agent: str | None = None


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]


# ---------------------------------------------------------------------------
# WebSocket message schemas
# ---------------------------------------------------------------------------


class WSIncoming(BaseModel):
    message: str
    persona: str


class WSOutgoing(BaseModel):
    type: str  # agent_start | chunk | done | error
    content: str | None = None
    agent: str | None = None
    report: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Health schema
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    status: str
