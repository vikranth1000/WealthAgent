# Bloomberg Terminal UI Design

**Date:** 2026-03-04
**Branch:** feat/duality-ui-revamp

---

## Goal

Replace the Apple visionOS light glass design with a classic Bloomberg Terminal aesthetic: near-black background, amber monospace text, maximum data density, pure flat 2D — no blur, no shadows, no rounded corners, no glass effects.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0D0D0D` | Page background |
| `--panel` | `#111111` | Panel backgrounds |
| `--border` | `#1E1E1E` | All panel/grid borders (1px solid) |
| `--amber` | `#FF9900` | Labels, active states, accents, cursor |
| `--amber-dim` | `#CC7A00` | Inactive tabs, secondary amber |
| `--text-primary` | `#FFFFFF` | Data values, numbers |
| `--text-secondary` | `#888888` | Muted descriptions, column headers |
| `--green` | `#00C805` | Positive P&L, gains |
| `--red` | `#FF3B30` | Negative P&L, losses |
| `--amber-bg` | `rgba(255,153,0,0.08)` | Active tab fill |

---

## Typography

- **Font:** `SF Mono, SFMono-Regular, Courier New, monospace` — everywhere, no exceptions
- **Base size:** `13px` body, `11px` labels, `10px` column headers
- **Hero number:** `2.5rem` (portfolio value) in `#FF9900`
- **Section headers:** `10px` uppercase, `#FF9900`, `letter-spacing: 0.12em`
- **No font-weight variation** — monospace weight is always 400/500, bold only for hero number

---

## Layout — Full Viewport, No Scroll

```
┌─ TOP BAR (40px) ──────────────────────────────────────────────────────────┐
│  ▸ WEALTHAGENT   [F1: MARGARET ▶]  [F2: ALEX]  [F3: PRIYA]  [F4: MERIDIAN]│
├──────────────────┬────────────────────────────────────────────────────────┤
│  LEFT SIDEBAR    │  PERFORMANCE                                  (180px)  │
│  (260px fixed)   │  [amber line chart, no fill, 6 x-axis ticks]           │
│                  ├───────────────────────────┬────────────────────────────┤
│  PORTFOLIO       │  SECTOR EXPOSURE          │  HOLDINGS                  │
│  client name     │  [horizontal text bars]   │  TICKER  SH   PX   P&L     │
│  $X,XXX,XXX      │                           │  ...                       │
│                  │                           │  (fills remaining height)  │
│  KEY METRICS     │                           │                            │
│  YTD ......+23%  │                           │                            │
│  SHARPE ....1.34 │                           │                            │
│  DRAWDN ...-6.5% │                           │                            │
│                  │                           │                            │
│  ALLOCATION      │                           │                            │
│  US EQ 63% ██    │                           │                            │
│  BOND  27% ██    │                           │                            │
│  CASH  10% ██    │                           │                            │
├──────────────────┴───────────────────────────┴────────────────────────────┤
│  CONSOLE BAR (42px)                                                        │
│  ● CONNECTED  >  Ask about Margaret's portfolio...           [SEND]  [⚡]  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Grid rules
- Left sidebar: `260px` fixed width, `1px solid var(--border)` right border
- Top right (performance): fixed `180px` height, `1px solid var(--border)` bottom border
- Bottom right split: sector (40%) + holdings (60%), separated by `1px solid var(--border)`
- Console bar: `42px` fixed height, `1px solid var(--border)` top border
- **No border-radius anywhere** (0px on all elements)
- **No box-shadow anywhere**
- **No backdrop-filter anywhere**

---

## Component Specs

### Top Bar
- `#111111` bg, `1px solid #1E1E1E` bottom border, `40px` height
- Wordmark: `WEALTHAGENT` in `#FF9900`, `11px`, `letter-spacing: 0.15em`
- Persona tabs: `[F1: MARGARET]` format
  - Inactive: `color: #888888`, no bg
  - Active: `color: #FF9900`, `background: rgba(255,153,0,0.08)`, `border-bottom: 2px solid #FF9900`
  - Hover: `color: #CC7A00`
- Right side: connection dot `●` in `#00C805` / `#FF3B30`

### Left Sidebar
- `260px` width, full height, `background: #111111`, `border-right: 1px solid #1E1E1E`
- **Portfolio section:** padding `12px`
  - Client name: `13px`, `#FFFFFF`
  - Persona label: `11px`, `#888888`
  - Total value: `2.5rem`, `#FF9900`, `font-weight: 600`
  - YTD badge: colored text only (no badge bg) — `+23.1% YTD` in `#00C805` or `#FF3B30`
- **Key metrics section:** `border-top: 1px solid #1E1E1E`, padding `12px`
  - Section header: `10px uppercase #FF9900 tracking-widest`
  - Each row: `YTD RETURN......+23.1%` — key in `#888888`, dots in `#333333`, value in `#FFFFFF`
  - Negative value (drawdown) in `#FF3B30`
- **Allocation section:** `border-top: 1px solid #1E1E1E`, padding `12px`
  - Section header: same amber style
  - Each row: `US EQUITY  63%  ██████░░░░` — name `#888888`, pct `#FFFFFF`, bar in `#FF9900` (filled) / `#333333` (empty), bar width proportional to value
  - No pie chart — text bars only

### Performance Chart (top-right)
- `background: #0D0D0D`, padding `12px`
- Section header: `PERFORMANCE` in amber
- Recharts AreaChart: **no fill** (or `stopOpacity: 0`), stroke `#FF9900`, `strokeWidth: 1.5`
- Grid: `stroke: #1E1E1E`, `strokeDasharray: none`
- Axes: `fill: #888888`, `fontSize: 10`
- X-axis: max 6 ticks, format `MMM 'YY` (e.g. `Mar '25`)
- Y-axis: `width: 56px`, compact format ($1.1M)
- No animation (terminal feel — data just appears)
- Tooltip: `background: #111111`, `border: 1px solid #FF9900`, amber label, white value

### Sector Exposure (bottom-right left)
- Section header amber
- Recharts BarChart horizontal: bar fill `#FF9900`, `radius: 0` (no rounded ends)
- Grid: `#1E1E1E`
- Axis ticks: `#888888`, `10px`
- Label values right of bar: `#FF9900`

### Holdings Table (bottom-right right)
- Section header: `HOLDINGS` amber
- Column headers: `10px uppercase #888888`
- Ticker: `#FF9900`
- Numbers: `#FFFFFF` monospace
- P&L: colored text only (`#00C805` / `#FF3B30`), no badge
- Row hover: `background: #1A1A1A`
- No AnimatePresence sort animation (static, terminal-like — rows just reorder)
- Sortable columns: active sort indicator `▲`/`▼` in amber

### Console Bar
- `42px` height, `background: #111111`, `border-top: 1px solid #1E1E1E`
- Left: connection dot `●` colored, `CONNECTED` / `RECONNECTING` in `#888888 10px`
- Center: `> ` prompt prefix in `#FF9900`, plain text input, `#FFFFFF` text, no border on input itself
- Right: `[SEND]` button in amber text / `[⚡ ACTIONS]` button
- Input `background: transparent`, `outline: none`

### Chat Panel (2D overlay)
- Triggered by: clicking console bar input or pressing Enter
- Appears as: flat `#111111` rectangle, `border: 1px solid #FF9900` (amber border = active state), positioned `bottom: 42px`, `left: 0`, `right: 0`, height `60vh`
- **No border-radius, no blur, no shadow** — pure flat rectangle
- Header: `1px solid #1E1E1E` bottom border — `AI CONSOLE — MARGARET` in `#FF9900 10px uppercase` + `[X]` close in `#888888`
- Message area: scrollable, `background: #0D0D0D`
- User messages: right-aligned, `#FF9900` text, `> ` prefix
- AI messages: left-aligned, `#FFFFFF` text, no bubble — just text
- Suggested prompts: flat buttons `border: 1px solid #1E1E1E`, `color: #888888`, hover `border-color: #FF9900 color: #FF9900`
- Agent indicator: `ANALYZING...` text in amber with blinking `_` cursor, no dots animation
- Empty state: centered `NO MESSAGES` in `#888888`
- Framer Motion: simple `y` translate only (no scale, no opacity blur) — slide up from console bar

---

## Files to Change

| File | Change |
|---|---|
| `frontend/src/index.css` | Complete replacement — terminal CSS variables, remove all glass utilities |
| `frontend/tailwind.config.js` | Monospace font stack, keep existing structure |
| `frontend/src/App.jsx` | Complete rewrite — fixed layout, left sidebar, right panels, console bar |
| `frontend/src/components/Dashboard/HeroCard.jsx` | Delete — content moves into left sidebar in App.jsx |
| `frontend/src/components/Chat/ChatBar.jsx` | Complete rewrite — console bar + 2D flat panel |
| `frontend/src/components/Chat/PersonaPills.jsx` | Rewrite — terminal F-key tab style |
| `frontend/src/components/Dashboard/MetricCards.jsx` | Delete — content moves into left sidebar |
| `frontend/src/components/Dashboard/AllocationChart.jsx` | Replace with text bar component |
| `frontend/src/components/Dashboard/PerformanceChart.jsx` | Update — remove fill, amber line, dark grid, 6 ticks |
| `frontend/src/components/Dashboard/SectorChart.jsx` | Update — remove radius, amber bars, dark grid |
| `frontend/src/components/Dashboard/HoldingsTable.jsx` | Update — remove AnimatePresence, terminal colors |
| `frontend/src/components/Chat/ChatInput.jsx` | Update — transparent input, amber prompt |
| `frontend/src/components/Chat/MessageBubble.jsx` | Update — flat text style, no bubbles |
| `frontend/src/components/Chat/AgentIndicator.jsx` | Update — `ANALYZING...` blinking cursor |
| `frontend/src/components/Chat/SuggestedPrompts.jsx` | Update — flat border buttons |
| `frontend/src/components/Chat/ChatWindow.jsx` | Update — dark bg, terminal colors |
