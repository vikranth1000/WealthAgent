# UI Revamp Design — "Duality"
**Date:** 2026-03-03 | **Status:** Approved

---

## Overview

Full end-to-end UI revamp of WealthAgent using a **glassmorphism dark** aesthetic with a **"Duality" layout** — two intentional halves (chat left, portfolio right) unified by a persona-colored glowing divider. The defining interaction: switching personas shifts the entire color temperature of the interface in 1.2s.

---

## 1. Foundation

### Color System

```
Base background:     #0F172A   (deep slate)
Left panel:          #080D1A   (chat, slightly darker)
Right panel:         bg-white/[0.04]  (glass, portfolio data)
Surface / cards:     bg-white/[0.06] + border-white/[0.08]
Text primary:        #F1F5F9   (slate-100)
Text secondary:      #64748B   (slate-500)
Text muted:          #334155   (slate-700)
```

**Persona CSS custom properties** (`--persona-primary`, transitions at 1.2s ease):
| Persona | Name | Color |
|---|---|---|
| conservative_retiree | Margaret Chen | `#3B82F6` sapphire blue |
| aggressive_growth | Alex Rodriguez | `#F59E0B` amber gold |
| young_professional | Priya Sharma | `#8B5CF6` violet |
| institutional | Meridian Capital | `#2DD4BF` teal-cyan |

**Background**: 3 large radial gradient blobs at `var(--persona-primary)` with 4% opacity drifting slowly. Barely perceptible, creates depth.

### Typography

| Role | Font | Usage |
|---|---|---|
| Display / Logo | **Syne** | Wordmark, headings, persona names |
| UI / Body | **DM Sans** | Labels, body text, chat input |
| Data / Numbers | **Geist Mono** | All numeric values, percentages, tickers |

No Inter. All loaded from Google Fonts / Fontsource.

---

## 2. Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░ #0F172A background mesh ░░░░░░░░░░░░░░░░ │
│ ░                                                       ░ │
│ ░  ┌──────────────────────┐ ▐ ┌─────────────────────┐  ░ │
│ ░  │   LEFT: Chat  (55%)  │▐▌│  RIGHT: Data (45%)  │  ░ │
│ ░  │  #080D1A glass       │▐▌│  bg-white/[0.04]    │  ░ │
│ ░  │                      │▐▌│                     │  ░ │
│ ░  │  [Logo] [Persona pills]  │  [Client header]    │  ░ │
│ ░  │  ─────────────────── │▐▌│  [Metric chips]     │  ░ │
│ ░  │  [Chat messages]     │▐▌│  [Allocation donut] │  ░ │
│ ░  │       scroll ▼       │▐▌│  [Performance area] │  ░ │
│ ░  │                      │▐▌│  [Sector bars]      │  ░ │
│ ░  │  ─────────────────── │▐▌│  [Holdings table]   │  ░ │
│ ░  │  [Input + actions]   │▐▌│                     │  ░ │
│ ░  └──────────────────────┘ ▐ └─────────────────────┘  ░ │
│ ░                           ▲                           ░ │
│ ░             glowing persona-color divider             ░ │
└──────────────────────────────────────────────────────────┘
```

**No top header bar. No sidebar rail.** The layout IS the product.

---

## 3. Component Designs

### 3.1 Persona Switcher
Horizontal pills at top-left of chat panel, inline with the "WealthAgent" wordmark.

- **Active pill**: glass card, `border: 1px solid var(--persona-primary)`, glow: `box-shadow: 0 0 12px var(--persona-primary)/40%`, persona dot + name
- **Inactive pills**: `opacity: 0.45`, hover → `opacity: 0.8`
- **Switch**: active pill pulse-expands → persona color washes the interface over 1.2s

### 3.2 Chat Panel

**User bubbles** (right-aligned):
- `bg: var(--persona-primary)/15%`
- `border: 1px solid var(--persona-primary)/30%`
- Text: slate-100, DM Sans

**Assistant bubbles** (left-aligned):
- `bg-white/[0.04]`
- `border-left: 3px solid var(--persona-primary)/60%`
- `box-shadow: 0 4px 24px rgba(0,0,0,0.20)`

**Inline blocks** (metrics, charts, tables): nested glass cards, `bg-black/20%`, darker than bubble background. Data materializes mid-conversation.

### 3.3 Glowing Divider
```
width:   1px
color:   var(--persona-primary) at 50% opacity
glow:    box-shadow: 0 0 8px var(--persona-primary)/30%
```
While AI is generating: breathes (opacity 50% → 80% → 50%, 2s loop).

### 3.4 Chat Input
Full-width glass bar at bottom of left panel:
- `bg-white/[0.05]`, `border: 1px solid white/[0.10]`
- Focus: `box-shadow: 0 0 0 2px var(--persona-primary)/40%`
- Send button: `bg: var(--persona-primary)`, rounded-full
- Action icon-buttons (Rebalance, Tax Harvest, Stress Test, Report) to the left

### 3.5 Agent Progress
Slim `2px` progress bar at the top of the chat area (below persona pills), persona-colored, animates left→right while agents are running. Step label appears as faint text: `"Portfolio Analyzer → Market Research → Comms"` with active step highlighted.

### 3.6 Suggested Prompts
Ghost chips floating above input:
- `border: 1px solid white/[0.12]`, `bg-transparent`
- Hover: `border-color: var(--persona-primary)/60%`
- Disappear when user starts typing

### 3.7 Right Panel Header
```
Client name      (Syne, text-xl, slate-100)
Portfolio value  (Geist Mono, text-3xl, var(--persona-primary))
Persona label + YTD return pill
```

### 3.8 Metric Chips
2×2 grid of minimal glass chips:
- `bg-white/[0.06]`, `border: 1px solid white/[0.08]`
- Label: DM Sans, uppercase, text-[10px], slate-500
- Value: Geist Mono, text-lg, slate-100

### 3.9 Charts (restyled)
All Recharts charts get a dark theme override:
- Background: transparent
- Primary series color: `var(--persona-primary)`
- Grid lines: `white/[0.05]`
- Axis labels: Geist Mono, slate-500
- Tooltips: glass card style

---

## 4. Motion & Transitions

| Moment | Animation | Duration |
|---|---|---|
| App load | Left fades in → divider draws top→bottom → right fades in | Staggered 0/200/400ms |
| Persona switch | Pill pulse → color wash left panel → divider recolors → right panel recolors → mesh shifts | 1.2s total |
| Message arrive | Slide up 8px + fade in | 200ms ease-out |
| AI generating | Divider breathes (opacity pulse) + typing cursor in persona color | 2s loop |
| Chart update | Recharts native smooth transition | 700ms |
| Metric value change | Count-up from old to new | 600ms |

---

## 5. Files to Modify

| File | Change |
|---|---|
| `frontend/tailwind.config.js` | New color tokens, font families, custom utilities |
| `frontend/src/index.css` | CSS custom properties for persona theming, font imports, glass utilities |
| `frontend/src/App.jsx` | New layout structure (no header, no sidebar, duality split) |
| `frontend/src/components/Layout/Header.jsx` | Remove or inline into left panel top bar |
| `frontend/src/components/Layout/Sidebar.jsx` | Remove sidebar, replace with inline persona pills |
| `frontend/src/components/Layout/RightPanel.jsx` | Restyle as right half of duality layout |
| `frontend/src/components/Chat/ChatWindow.jsx` | New chat panel shell, agent progress bar |
| `frontend/src/components/Chat/ChatInput.jsx` | Glass input, persona-colored send button |
| `frontend/src/components/Chat/MessageBubble.jsx` | Redesigned user/assistant bubble styles |
| `frontend/src/components/Chat/AgentIndicator.jsx` | Replace with slim progress bar + step label |
| `frontend/src/components/Chat/SuggestedPrompts.jsx` | Ghost chip style |
| `frontend/src/components/Dashboard/MetricCards.jsx` | Glass chip grid, Geist Mono values |
| `frontend/src/components/Dashboard/AllocationChart.jsx` | Dark theme, persona color |
| `frontend/src/components/Dashboard/PerformanceChart.jsx` | Dark theme, persona color |
| `frontend/src/components/Dashboard/SectorChart.jsx` | Dark theme, persona color |
| `frontend/src/components/Dashboard/HoldingsTable.jsx` | Dark glass rows |
| `frontend/src/components/Chat/blocks/*.jsx` | Dark glass block styles |

---

## 6. Implementation Approach

1. **Foundation first**: Tailwind config, CSS variables, font imports — establishes the theming system everything else builds on
2. **App shell**: New layout structure in App.jsx — the duality split with the glowing divider
3. **Persona system**: CSS custom property switching with transitions — the key interaction
4. **Left panel**: Persona pills, chat window, message bubbles, input, agent progress
5. **Right panel**: Portfolio header, metric chips, chart restyling, holdings table
6. **Inline blocks**: Restyle all chat block components to match dark glass aesthetic
7. **Polish**: Animations, load sequence, micro-interactions

Each step is independently testable by running `npm run dev`.
