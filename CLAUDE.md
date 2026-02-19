# CLAUDE.md — WealthAgent

## What This Project Is
Multi-agent AI wealth management assistant. Portfolio project for State Street Wealth R&D Co-op.
**Read `PRD.md` for full architecture, schemas, personas, and implementation plan.**

## Commands
```bash
# Backend
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000
pytest tests/ -v

# Frontend
cd frontend && npm run dev

# Full stack
docker-compose up --build
```

## Tech Stack (Do Not Substitute)
- **Agents:** LangGraph (NOT LangChain agents, NOT CrewAI)
- **LLM:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts
- **Database:** PostgreSQL (SQLite fallback for dev)
- **Market Data:** yfinance

## Project Structure
```
wealthagent/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings and env vars
│   ├── agents/              # LangGraph agents + orchestrator
│   ├── analytics/           # Portfolio math (no LLM calls here)
│   ├── data/                # Models, DB connection, seed data
│   ├── api/                 # Routes, WebSocket, schemas
│   ├── personas/            # Persona definitions + templates
│   └── tests/
├── frontend/src/
│   ├── components/          # Chat/, Dashboard/, Reports/, Layout/
│   ├── hooks/               # useWebSocket, usePortfolio
│   └── services/            # API client
└── docs/
```

## Coding Rules

### Python
- Python 3.11+. Type hints on ALL functions.
- Pydantic models for all API boundaries. No raw dicts.
- Async by default for FastAPI routes.
- Google-style docstrings on public functions.
- No `print()` — use `logging`.
- Tests: pytest + pytest-asyncio.

### React/JS
- Functional components only. Tailwind only (no inline styles, no CSS modules).
- Custom hooks for reusable logic. Components under 150 lines.
- No `console.log` in committed code.

### General
- Never hardcode secrets. Use env vars via `config.py`.
- New dependencies → immediately add to requirements.txt / package.json.

## Architecture Rules
- **`analytics/` is pure math.** No LLM calls. Deterministic calculations only.
- **Agents call analytics as LangGraph tools.**
- **Comms agent has no tools.** LLM-only, takes prior agent outputs + persona context.
- **Orchestrator routes, doesn't process.** Classifies intent → selects agent path. No business logic.
- **State flows one direction:** Query → Orchestrator → Agent(s) → Comms → Response.

## Git Commit Rules
- Never include `Co-Authored-By` lines in commit messages.

## Do NOT
- Add authentication/login. Persona selector IS the user switcher.
- Use LangChain agent abstractions. Use LangGraph StateGraph directly.
- Hardcode market data. Fetch from yfinance (cache 1hr TTL).
- Build mobile layout. Desktop-first only.
- Skip error handling on LLM calls. Always: timeout → retry → fallback.
- Generate advice without disclaimer footer.
- Create separate CSS files. Tailwind in JSX only.

## Key Design Decisions (Don't Override)
1. **4 personas** with distinct communication styles (see PRD.md §4).
2. **WebSocket for chat** — streaming + real-time agent status.
3. **Agent status visible in UI** — user sees which agent is working.
4. **Same data, different voice** — persona-adapted output is the core differentiator.

## Development Workflow

### Mistake Log
When a bug or wrong approach is discovered during development, append it to the "Do NOT" section above so it never recurs. Keep entries short: what went wrong → what to do instead.

### Phase Transitions
Before starting a new implementation phase, re-read CLAUDE.md and the relevant PRD.md section. Confirm what's complete and what's next before writing code.

### Testing
Write failing tests FIRST, then implement until tests pass. Every module in `analytics/` and every agent in `agents/` must have corresponding tests.

### Subagents
Use subagents for independent, parallelizable work (e.g., implementing separate analytics modules or separate React components simultaneously).

### UI Verification
When the user provides a screenshot, compare it against PRD.md §7 and fix discrepancies.

## When Unsure
Read `PRD.md` — it has detailed specs for everything.
