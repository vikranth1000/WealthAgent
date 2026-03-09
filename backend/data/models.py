"""SQLAlchemy ORM models for WealthAgent."""

import uuid
from datetime import date, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Client(Base):
    """Wealth management client."""

    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    persona: Mapped[str] = mapped_column(String(50), nullable=False)
    risk_tolerance: Mapped[int] = mapped_column(Integer, nullable=False)
    investment_goals: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string

    portfolios: Mapped[list["Portfolio"]] = relationship("Portfolio", back_populates="client", cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="client", cascade="all, delete-orphan")


class Portfolio(Base):
    """Client investment portfolio."""

    __tablename__ = "portfolios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_allocation: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string

    client: Mapped["Client"] = relationship("Client", back_populates="portfolios")
    holdings: Mapped[list["Holding"]] = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")


class Holding(Base):
    """Individual security holding within a portfolio."""

    __tablename__ = "holdings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id: Mapped[str] = mapped_column(String(36), ForeignKey("portfolios.id"), nullable=False)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    shares: Mapped[float] = mapped_column(Float, nullable=False)
    cost_basis: Mapped[float] = mapped_column(Float, nullable=False)  # per share
    purchase_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO date string
    asset_class: Mapped[str] = mapped_column(String(50), nullable=False)
    sector: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Enhanced Portfolio Data
    current_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    market_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    day_change_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    pe_ratio: Mapped[float] = mapped_column(Float, nullable=True)
    dividend_yield: Mapped[float] = mapped_column(Float, nullable=True)

    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="holdings")


class ChatMessage(Base):
    """Chat message in a client conversation."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user / assistant / system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    agent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    client: Mapped["Client"] = relationship("Client", back_populates="chat_messages")
