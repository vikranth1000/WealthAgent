# Product Requirements Document — WealthAgent
**Version:** 1.0 | **Date:** February 2026 | **Status:** Planning

---

## 1. Summary

WealthAgent is a proof-of-concept multi-agent AI wealth management assistant. Three specialized agents — Portfolio Analyzer, Market Researcher, and Client Communicator — coordinate via LangGraph to deliver persona-adapted financial insights through a chat interface with an integrated portfolio dashboard.

**Core thesis:** Agentic AI can transform wealth management from static, one-size-fits-all reporting into dynamic, conversational, persona-aware advisory.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│              React Frontend (Vite + Tailwind)         │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Chat UI  │  │  Dashboard  │  │ Persona Select │  │
│  └────┬─────┘  └──────┬──────┘  └───────┬────────┘  │
└───────┼───────────────┼─────────────────┼────────────┘
        │ WebSocket     │ REST            │
┌───────▼───────────────▼─────────────────▼────────────┐
│              FastAPI Backend                           │
│  ┌────────────────────────────────────────────────┐   │
│  │           LangGraph Orchestrator                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ │   │
│  │  │ Portfolio  │ │  Market    │ │  Client    │ │   │
│  │  │ Analyzer   │ │  Research  │ │  Comms     │ │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ │   │
│  └────────┼──────────────┼───────────────┼────────┘   │
│     ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼────────┐   │
│     │ analytics/ │ │ News/Web   │ │ Claude API   │   │
│     │ (pure math)│ │ APIs       │ │ (LLM)        │   │
│     └─────┬──────┘ └────────────┘ └──────────────┘   │
│     ┌─────▼──────────────────────────────────────┐    │
│     │  PostgreSQL / SQLite (clients, portfolios) │    │
│     └────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

### Agent Flow (LangGraph StateGraph)
```
START → route_query (LLM classifier)
  ├── "portfolio" → Portfolio Agent → Comms Agent → END
  ├── "market"    → Market Agent → Comms Agent → END
  ├── "full_review" → Portfolio Agent → Market Agent → Comms Agent → END
  └── "general"   → Comms Agent (direct) → END
```

### Orchestrator State
```python
class WealthAgentState(TypedDict):
    client_id: str
    query: str
    persona: str
    portfolio_analysis: Optional[PortfolioAnalysis]
    market_research: Optional[MarketResearch]
    client_report: Optional[ClientReport]
    chat_history: list[dict]
    current_agent: str       # Surfaced in UI
    error: Optional[str]
```

---

## 3. Data Model

### Tables

**clients**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | str | |
| persona | str | conservative_retiree / aggressive_growth / young_professional / institutional |
| risk_tolerance | int | 1-10 |
| investment_goals | JSON str | |

**portfolios**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| client_id | UUID | FK → clients |
| name | str | e.g. "Retirement Fund" |
| target_allocation | JSON str | {"US Equity": 0.6, "Bonds": 0.3, "Cash": 0.1} |

**holdings**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| portfolio_id | UUID | FK → portfolios |
| ticker | str | e.g. "AAPL" |
| shares | float | |
| cost_basis | float | Per share |
| purchase_date | date | |
| asset_class | str | US Equity / Intl Equity / Bond / Cash / Alternative |
| sector | str | Technology / Healthcare / etc. |

**chat_messages**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| client_id | UUID | FK → clients |
| role | str | user / assistant / system |
| content | str | |
| agent | str | nullable — which agent handled this |
| timestamp | datetime | |

### Seed Data (4 Clients)

**Margaret Chen — Conservative Retiree** (age 68, retired teacher, $1.2M)
- Risk: 2/10. Goal: Capital preservation + income.
- Holdings: 30% bonds (BND, AGG), 40% dividend stocks (JNJ, PG, KO, VZ), 20% S&P (VOO), 10% cash

**Alex Rodriguez — Aggressive Growth** (age 32, startup founder, $450K)
- Risk: 9/10. Goal: Max growth.
- Holdings: 50% tech (NVDA, MSFT, AMZN, META), 25% growth ETFs (QQQ, ARKK), 15% international (EFA), 10% crypto-adjacent (COIN, MSTR)

**Priya Sharma — Young Professional** (age 26, data scientist, $85K)
- Risk: 6/10. Goal: Build wealth, learn investing.
- Holdings: 60% S&P (VOO), 15% international (VXUS), 15% bonds (BND), 10% picks (AAPL, GOOGL)

**Meridian Capital — Institutional** (hedge fund, $50M allocation)
- Risk: 7/10. Goal: Risk-adjusted returns, Sharpe > 1.0.
- Holdings: 35% US equity (SPY, IWM), 20% international (EFA, EEM), 20% fixed income (TLT, LQD), 15% alternatives (GLD, GSG), 10% cash

---

## 4. Persona Communication Specs

The same portfolio data MUST produce distinctly different outputs per persona. This is the project's core differentiator.

| Dimension | Conservative Retiree | Aggressive Growth | Young Professional | Institutional |
|-----------|---------------------|-------------------|-------------------|---------------|
| Reading Level | 8th grade | College | High school | Graduate |
| Jargon | None | Moderate | Low + explanations | High |
| Tone | Warm, reassuring | Direct, concise | Encouraging, educational | Neutral, quantitative |
| Data Density | Low | Medium-High | Medium | Very High |
| Risk Framing | "Your savings are safe" | "Upside potential" | "Here's what this means" | Raw numbers |
| Length | Medium | Short | Medium-Long | Short (dense) |

### Sample Interactions

**Conservative Retiree — "How is my portfolio doing?"**
> "Good news, Margaret — your portfolio is doing well. Your total value is $1,218,400, up 0.8% this month. Your dividend income remains steady at about $3,200/month. One thing to note: your stock allocation has drifted slightly above target. We might want to trim a small amount to keep your risk comfortable. Want me to show what that looks like?"

**Aggressive Growth — "Tax harvesting opportunities?"**
> "Found 2 candidates. ARKK down 18.3% (-$4,125 unrealized) — swap to QQQM to avoid wash sale. COIN down 12.7% (-$2,540) — swap to BITO. Total tax benefit: ~$1,665 at 25% bracket. Both maintain your growth tilt. Want the after-tax model?"

**Young Professional — "Explain my portfolio risk"**
> "Great question! Your portfolio's volatility is about 14.2% annually — meaning in a typical year it might swing between +23% and -5%. Your Sharpe ratio of 0.82 is solid (anything above 0.5 is decent). The biggest risk: AAPL and GOOGL together are 10% of your holdings, adding stock-specific risk. Want me to explain what diversifying those would look like?"

**Institutional — "Performance attribution this quarter"**
> "Q4 Attribution — Return: +4.2% (Benchmark: +3.1%, Active: +110bps). Allocation: +65bps (OW US equity +42, UW FI +23). Selection: +45bps (EM +31, gold timing +14). Interaction: -2bps. Sharpe: 1.12 (12mo). Max DD: -3.8%. Factor: Mom +0.32, Val -0.15, Size +0.08."

---

## 5. Agent Specifications

### Portfolio Analyzer Agent
**Tools (Python functions → LangGraph tools):**
- `calculate_portfolio_metrics(client_id)` → Sharpe, Sortino, max drawdown, beta, volatility
- `get_current_allocation(client_id)` → Asset class percentages
- `suggest_rebalancing_trades(client_id)` → Trades to reach target
- `find_tax_loss_candidates(client_id, threshold=-0.05)` → Holdings with unrealized losses
- `get_sector_breakdown(client_id)` → Sector exposure

**Output:** `PortfolioAnalysis` — summary, total_value, metrics dict, allocation current/target, trades, tax candidates, risk flags

### Market Research Agent
**Tools:**
- `fetch_ticker_news(tickers, days=7)` → Recent headlines
- `get_macro_indicators()` → Fed rate, inflation, unemployment
- `get_sector_performance(period="1mo")` → Sector ETF returns

**Output:** `MarketResearch` — summary, portfolio-relevant news, macro outlook, sector trends, risk alerts

### Client Communication Agent
**No tools.** Takes PortfolioAnalysis + MarketResearch + persona definition → generates persona-appropriate report via LLM.

**Output:** `ClientReport` — greeting, executive_summary, portfolio_section, market_section, recommendations list

---

## 6. API Contract

### REST Endpoints
```
GET    /api/health
GET    /api/clients
GET    /api/clients/{id}
GET    /api/clients/{id}/portfolio
GET    /api/clients/{id}/analysis
GET    /api/clients/{id}/chat-history
POST   /api/chat                        # Non-streaming fallback
DELETE /api/clients/{id}/chat-history
```

### WebSocket
```
WS /ws/chat/{client_id}

→ Client sends:  { "message": "...", "persona": "..." }
← Server sends:
  { "type": "agent_start", "agent": "portfolio_analyzer" }
  { "type": "chunk", "content": "..." }  # Streaming tokens
  { "type": "agent_start", "agent": "comms" }
  { "type": "chunk", "content": "..." }
  { "type": "done", "report": { ... } }
```

---

## 7. Frontend Specs

### Layout
- **Left sidebar:** Client/persona cards, nav
- **Center:** Chat interface (primary)
- **Right panel (collapsible):** Portfolio dashboard

### Chat Features
- Streaming with typewriter effect
- Agent status indicator ("Portfolio Analyzer is thinking...")
- Persona-specific suggested prompts
- Markdown rendering in responses
- Disclaimer footer on all AI responses

### Dashboard Components (Recharts)
- Donut chart: Asset allocation (current vs. target)
- Line chart: Portfolio performance over time
- Bar chart: Sector exposure
- Metric cards: Total value, YTD return, Sharpe, max drawdown
- Sortable holdings table

### Design
- Colors: Navy (#1B2A4A), Teal (#0D9488), Light Gray (#F8FAFC)
- Font: Inter / system sans-serif
- Professional fintech aesthetic

---

## 8. Analytics Functions

All in `analytics/` — pure Python, no LLM calls, fully testable.

| Function | Module | Formula |
|----------|--------|---------|
| Total portfolio value | portfolio.py | Σ(shares × current_price) |
| Total return % | portfolio.py | (current - cost_basis) / cost_basis |
| Sharpe ratio | metrics.py | (R_p - R_f) / σ_p |
| Sortino ratio | metrics.py | (R_p - R_f) / σ_downside |
| Max drawdown | metrics.py | Max peak-to-trough decline |
| Beta | metrics.py | Cov(R_p, R_m) / Var(R_m) |
| Annualized volatility | metrics.py | std(returns) × √252 |
| Allocation drift | rebalancing.py | |current% - target%| per class |
| Rebalancing trades | rebalancing.py | Trades to reach target |
| Tax-loss candidates | tax_loss.py | Holdings where unrealized return < threshold |

---

## 9. Error Handling

| Error | Strategy |
|-------|----------|
| LLM timeout | Retry once after 5s → fallback message |
| LLM rate limit | Exponential backoff (2s, 4s, 8s) |
| yfinance failure | Return cached prices (< 1hr old) |
| Agent invalid output | Log, skip agent, continue pipeline |
| WebSocket disconnect | Frontend auto-reconnect with backoff |
| DB connection failure | Fall back to SQLite if configured |

---

## 10. Testing

### Unit Tests
- `analytics/metrics.py` — Sharpe/Sortino for known returns, edge cases
- `analytics/rebalancing.py` — Correct trade direction, already-balanced portfolio
- `analytics/tax_loss.py` — Identifies losses, handles no-loss portfolio
- `agents/orchestrator.py` — Routes all 4 query types correctly

### Integration Tests
- Full chat flow: message → orchestrator → agents → response
- Portfolio analysis API: request → analytics computed → correct metrics

### Manual QA Checklist
- [ ] 4 personas produce visibly different outputs for same query
- [ ] Agent indicator shows correct active agent
- [ ] Dashboard charts render with real data
- [ ] Chat history persists across reloads
- [ ] Error states show friendly messages

---

## 11. Implementation Phases

| Phase | Days | Deliverables |
|-------|------|-------------|
| 1. Foundation | 1-2 | Project structure, DB models, seed data, basic React layout |
| 2. Analytics | 3-4 | All metrics, rebalancing, tax-loss, unit tests, analysis endpoint |
| 3. Agents | 5-7 | 3 agents + orchestrator + routing + chat endpoint |
| 4. Chat UI | 8-9 | WebSocket streaming, agent indicator, suggested prompts |
| 5. Dashboard | 10-12 | Charts, metrics cards, persona selector, polish |
| 6. Docs & Demo | 13-14 | README, architecture doc, innovation brief, demo recording |

---

## 12. Non-Goals
- Real brokerage integration / trade execution
- User authentication
- Real-time price streaming
- Mobile layout
- Multi-user / concurrent sessions
- Production cloud deployment (Docker local is sufficient)

---

## 13. Environment Variables
```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:pass@localhost:5432/wealthagent
SQLITE_FALLBACK=true
NEWS_API_KEY=...              # Optional, for market agent
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173
```

---

## 14. Dependencies

**Backend (requirements.txt)**
```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
langgraph>=0.2.0
langchain-anthropic>=0.3.0
langchain-core>=0.3.0
anthropic>=0.40.0
yfinance>=0.2.36
pandas>=2.2.0
numpy>=1.26.0
python-dotenv>=1.0.0
websockets>=12.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

**Frontend (package.json)**
```
react ^18.3, react-dom ^18.3, recharts ^2.12,
lucide-react ^0.344, tailwindcss ^3.4, vite ^5.1
```
