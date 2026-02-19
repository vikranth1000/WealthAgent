"""Seed data for WealthAgent — 4 clients with portfolios and holdings per PRD §3."""

import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from data.models import Client, Holding, Portfolio

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fixed UUIDs for idempotent seeding
# ---------------------------------------------------------------------------

CLIENT_IDS = {
    "margaret": "11111111-1111-1111-1111-111111111111",
    "alex": "22222222-2222-2222-2222-222222222222",
    "priya": "33333333-3333-3333-3333-333333333333",
    "meridian": "44444444-4444-4444-4444-444444444444",
}

PORTFOLIO_IDS = {
    "margaret": "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "alex": "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "priya": "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "meridian": "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
}

# ---------------------------------------------------------------------------
# Seed definitions
# ---------------------------------------------------------------------------

SEED_DATA: list[dict] = [
    {
        "client": {
            "id": CLIENT_IDS["margaret"],
            "name": "Margaret Chen",
            "persona": "conservative_retiree",
            "risk_tolerance": 2,
            "investment_goals": json.dumps(["Capital preservation", "Steady income", "Inflation protection"]),
        },
        "portfolio": {
            "id": PORTFOLIO_IDS["margaret"],
            "name": "Retirement Fund",
            "target_allocation": json.dumps({
                "Bond": 0.30,
                "US Equity": 0.60,
                "Cash": 0.10,
            }),
        },
        "holdings": [
            # Bonds — 30%
            {"ticker": "BND",  "shares": 1800,  "cost_basis": 73.50,  "purchase_date": "2021-03-15", "asset_class": "Bond",      "sector": "Fixed Income"},
            {"ticker": "AGG",  "shares": 1500,  "cost_basis": 93.00,  "purchase_date": "2021-06-01", "asset_class": "Bond",      "sector": "Fixed Income"},
            # Dividend stocks — 40%
            {"ticker": "JNJ",  "shares": 500,   "cost_basis": 155.00, "purchase_date": "2020-09-10", "asset_class": "US Equity", "sector": "Healthcare"},
            {"ticker": "PG",   "shares": 600,   "cost_basis": 135.00, "purchase_date": "2020-11-20", "asset_class": "US Equity", "sector": "Consumer Staples"},
            {"ticker": "KO",   "shares": 1200,  "cost_basis": 52.00,  "purchase_date": "2021-01-08", "asset_class": "US Equity", "sector": "Consumer Staples"},
            {"ticker": "VZ",   "shares": 2000,  "cost_basis": 52.00,  "purchase_date": "2021-02-14", "asset_class": "US Equity", "sector": "Communication Services"},
            # S&P 500 index — 20%
            {"ticker": "VOO",  "shares": 400,   "cost_basis": 395.00, "purchase_date": "2022-01-03", "asset_class": "US Equity", "sector": "Broad Market"},
            # Cash equivalent — 10%
            {"ticker": "SGOV", "shares": 1000,  "cost_basis": 100.00, "purchase_date": "2023-06-01", "asset_class": "Cash",      "sector": "Cash Equivalent"},
        ],
    },
    {
        "client": {
            "id": CLIENT_IDS["alex"],
            "name": "Alex Rodriguez",
            "persona": "aggressive_growth",
            "risk_tolerance": 9,
            "investment_goals": json.dumps(["Maximum capital appreciation", "Beat the market", "High risk tolerance"]),
        },
        "portfolio": {
            "id": PORTFOLIO_IDS["alex"],
            "name": "Growth Portfolio",
            "target_allocation": json.dumps({
                "US Equity": 0.75,
                "Intl Equity": 0.15,
                "Alternative": 0.10,
            }),
        },
        "holdings": [
            # Tech stocks — 50%
            {"ticker": "NVDA", "shares": 200,   "cost_basis": 450.00, "purchase_date": "2023-01-10", "asset_class": "US Equity", "sector": "Technology"},
            {"ticker": "MSFT", "shares": 100,   "cost_basis": 340.00, "purchase_date": "2022-06-15", "asset_class": "US Equity", "sector": "Technology"},
            {"ticker": "AMZN", "shares": 150,   "cost_basis": 130.00, "purchase_date": "2022-11-01", "asset_class": "US Equity", "sector": "Technology"},
            {"ticker": "META", "shares": 100,   "cost_basis": 280.00, "purchase_date": "2023-03-20", "asset_class": "US Equity", "sector": "Communication Services"},
            # Growth ETFs — 25%
            {"ticker": "QQQ",  "shares": 150,   "cost_basis": 360.00, "purchase_date": "2022-09-01", "asset_class": "US Equity", "sector": "Technology"},
            {"ticker": "ARKK", "shares": 500,   "cost_basis": 55.00,  "purchase_date": "2023-02-01", "asset_class": "US Equity", "sector": "Technology"},
            # International — 15%
            {"ticker": "EFA",  "shares": 700,   "cost_basis": 68.00,  "purchase_date": "2022-08-15", "asset_class": "Intl Equity", "sector": "International"},
            # Crypto-adjacent — 10%
            {"ticker": "COIN", "shares": 200,   "cost_basis": 150.00, "purchase_date": "2023-04-10", "asset_class": "Alternative", "sector": "Financial Services"},
            {"ticker": "MSTR", "shares": 50,    "cost_basis": 350.00, "purchase_date": "2023-05-01", "asset_class": "Alternative", "sector": "Technology"},
        ],
    },
    {
        "client": {
            "id": CLIENT_IDS["priya"],
            "name": "Priya Sharma",
            "persona": "young_professional",
            "risk_tolerance": 6,
            "investment_goals": json.dumps(["Build long-term wealth", "Learn investing", "Diversification"]),
        },
        "portfolio": {
            "id": PORTFOLIO_IDS["priya"],
            "name": "Wealth Builder",
            "target_allocation": json.dumps({
                "US Equity": 0.70,
                "Intl Equity": 0.15,
                "Bond": 0.15,
            }),
        },
        "holdings": [
            # S&P 500 — 60%
            {"ticker": "VOO",  "shares": 70,    "cost_basis": 415.00, "purchase_date": "2022-02-01", "asset_class": "US Equity", "sector": "Broad Market"},
            # International — 15%
            {"ticker": "VXUS", "shares": 180,   "cost_basis": 55.00,  "purchase_date": "2022-04-15", "asset_class": "Intl Equity", "sector": "International"},
            # Bonds — 15%
            {"ticker": "BND",  "shares": 130,   "cost_basis": 76.00,  "purchase_date": "2022-07-01", "asset_class": "Bond",      "sector": "Fixed Income"},
            # Individual picks — 10%
            {"ticker": "AAPL", "shares": 25,    "cost_basis": 165.00, "purchase_date": "2023-01-20", "asset_class": "US Equity", "sector": "Technology"},
            {"ticker": "GOOGL","shares": 20,    "cost_basis": 135.00, "purchase_date": "2023-03-10", "asset_class": "US Equity", "sector": "Technology"},
        ],
    },
    {
        "client": {
            "id": CLIENT_IDS["meridian"],
            "name": "Meridian Capital",
            "persona": "institutional",
            "risk_tolerance": 7,
            "investment_goals": json.dumps(["Risk-adjusted returns", "Sharpe ratio > 1.0", "Capital allocation efficiency"]),
        },
        "portfolio": {
            "id": PORTFOLIO_IDS["meridian"],
            "name": "Institutional Allocation",
            "target_allocation": json.dumps({
                "US Equity": 0.35,
                "Intl Equity": 0.20,
                "Bond": 0.20,
                "Alternative": 0.15,
                "Cash": 0.10,
            }),
        },
        "holdings": [
            # US Equity — 35%
            {"ticker": "SPY",  "shares": 20000, "cost_basis": 418.00, "purchase_date": "2021-01-04", "asset_class": "US Equity", "sector": "Broad Market"},
            {"ticker": "IWM",  "shares": 15000, "cost_basis": 195.00, "purchase_date": "2021-01-04", "asset_class": "US Equity", "sector": "Small Cap"},
            # International — 20%
            {"ticker": "EFA",  "shares": 30000, "cost_basis": 70.00,  "purchase_date": "2021-02-01", "asset_class": "Intl Equity", "sector": "International Developed"},
            {"ticker": "EEM",  "shares": 20000, "cost_basis": 48.00,  "purchase_date": "2021-02-01", "asset_class": "Intl Equity", "sector": "Emerging Markets"},
            # Fixed Income — 20%
            {"ticker": "TLT",  "shares": 30000, "cost_basis": 120.00, "purchase_date": "2021-03-01", "asset_class": "Bond",      "sector": "Fixed Income"},
            {"ticker": "LQD",  "shares": 25000, "cost_basis": 118.00, "purchase_date": "2021-03-15", "asset_class": "Bond",      "sector": "Fixed Income"},
            # Alternatives — 15%
            {"ticker": "GLD",  "shares": 15000, "cost_basis": 172.00, "purchase_date": "2021-04-01", "asset_class": "Alternative", "sector": "Commodities"},
            {"ticker": "GSG",  "shares": 20000, "cost_basis": 19.00,  "purchase_date": "2021-04-15", "asset_class": "Alternative", "sector": "Commodities"},
            # Cash — 10%
            {"ticker": "SHV",  "shares": 50000, "cost_basis": 110.00, "purchase_date": "2023-01-03", "asset_class": "Cash",      "sector": "Cash Equivalent"},
        ],
    },
]


async def seed_database(db: AsyncSession) -> None:
    """Insert seed clients, portfolios, and holdings if they do not already exist.

    Args:
        db: Active async database session.
    """
    # Check if seed data already present
    result = await db.execute(select(Client).where(Client.id == CLIENT_IDS["margaret"]))
    if result.scalar_one_or_none() is not None:
        logger.info("Seed data already present — skipping.")
        return

    logger.info("Inserting seed data for 4 clients...")

    for entry in SEED_DATA:
        client = Client(
            id=entry["client"]["id"],
            name=entry["client"]["name"],
            persona=entry["client"]["persona"],
            risk_tolerance=entry["client"]["risk_tolerance"],
            investment_goals=entry["client"]["investment_goals"],
        )
        db.add(client)

        portfolio = Portfolio(
            id=entry["portfolio"]["id"],
            client_id=client.id,
            name=entry["portfolio"]["name"],
            target_allocation=entry["portfolio"]["target_allocation"],
        )
        db.add(portfolio)

        for h in entry["holdings"]:
            holding = Holding(
                id=str(uuid.uuid4()),
                portfolio_id=portfolio.id,
                ticker=h["ticker"],
                shares=h["shares"],
                cost_basis=h["cost_basis"],
                purchase_date=h["purchase_date"],
                asset_class=h["asset_class"],
                sector=h["sector"],
            )
            db.add(holding)

    await db.commit()
    logger.info("Seed data inserted successfully.")
