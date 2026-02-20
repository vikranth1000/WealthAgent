# WealthAgent

Multi-agent AI wealth management assistant that delivers persona-adapted financial insights through a conversational interface with an integrated portfolio dashboard.


## Architecture

```
React Frontend (Vite + Tailwind)
  Chat UI  |  Dashboard  |  AI Tools  |  Persona Selector
        WebSocket + REST
FastAPI Backend
  LangGraph Orchestrator
    Portfolio Analyzer → Market Research → Client Comms
  analytics/ (pure math) | Claude API (LLM) | yfinance (market data)
  PostgreSQL / SQLite
```

**Agent flow** — every query is classified by an LLM router, then runs through the appropriate pipeline:

```
START → route_query
  ├── "portfolio"    → Portfolio Agent → Comms Agent → END
  ├── "market"       → Portfolio Agent → Market Agent → Comms Agent → END
  └── "full_review"  → Portfolio Agent → Market Agent → Comms Agent → END
```

The Comms Agent adapts its tone and detail level based on the selected persona. Same data, different voice.

## Features

- **Multi-agent pipeline** — LangGraph StateGraph orchestrates Portfolio Analyzer, Market Researcher, and Client Communicator agents
- **4 client personas** — Conservative Retiree, Aggressive Growth, Young Professional, Institutional — each with distinct communication styles
- **Real-time streaming** — WebSocket chat with live agent status indicators and token streaming
- **AI Tools** — One-click Rebalancing, Tax-Loss Harvesting, Stress Testing, and Full Report with AI-powered analysis
- **Portfolio Dashboard** — Metric cards, allocation donut chart, performance line chart, sector exposure, holdings table with P&L
- **Dynamic follow-up suggestions** — Context-aware prompts generated after each response
- **Live market data** — Prices and analytics from yfinance with 1-hour TTL cache

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agents | LangGraph (StateGraph) |
| LLM | Anthropic Claude (claude-sonnet-4-20250514) |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Database | PostgreSQL (SQLite fallback for dev) |
| Market Data | yfinance |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone
git clone https://github.com/vikranth1000/WealthAgent.git
cd WealthAgent

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Seed the database and start
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the frontend proxies API requests to port 8000.

### Docker

```bash
docker-compose up --build
```

### Running Tests

```bash
cd backend
PYTHONPATH=. pytest tests/ -v
```

## Project Structure

```
WealthAgent/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── config.py                # Settings and env vars
│   ├── agents/                  # LangGraph agents + orchestrator
│   │   ├── orchestrator.py      # Intent classifier + StateGraph
│   │   ├── portfolio_agent.py   # Portfolio analysis tools
│   │   ├── market_agent.py      # Market research tools
│   │   ├── comms_agent.py       # Persona-adapted LLM responses
│   │   └── state.py             # WealthAgentState TypedDict
│   ├── analytics/               # Pure math (no LLM calls)
│   │   ├── portfolio.py         # Returns, Sharpe, Sortino, drawdown
│   │   ├── risk.py              # Beta, volatility, VaR
│   │   ├── allocation.py        # Drift calculation
│   │   ├── rebalancing.py       # Trade generation
│   │   └── tax_loss.py          # Harvesting candidates
│   ├── data/                    # Models, DB connection, seed data
│   ├── api/                     # REST routes, WebSocket, schemas
│   ├── personas/                # Persona definitions + prompt templates
│   └── tests/                   # pytest suite (64 tests)
├── frontend/src/
│   ├── components/
│   │   ├── Chat/                # ChatWindow, MessageBubble, Input, Prompts
│   │   ├── Dashboard/           # MetricCards, AllocationChart, Holdings, etc.
│   │   ├── Actions/             # AI Tools: Rebalance, TaxLoss, StressTest
│   │   └── Layout/              # Sidebar, Header, RightPanel
│   ├── hooks/                   # useWebSocket, usePortfolio, useClients
│   └── services/                # API client
└── PRD.md                       # Full product requirements document
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `DATABASE_URL` | No | PostgreSQL URL (defaults to SQLite) |
| `NEWS_API_KEY` | No | News API key for market research |
| `LOG_LEVEL` | No | Logging level (default: INFO) |

## License

This project is for educational and portfolio demonstration purposes.
