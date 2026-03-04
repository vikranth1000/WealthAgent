# Apple visionOS Light Glass UI Design

**Date:** 2026-03-04
**Branch:** feat/duality-ui-revamp
**Goal:** Redesign WealthAgent from the current dark glassmorphism duality split into an Apple visionOS-inspired light vibrancy layout. Data takes the full screen in a bento grid; chat collapses to a floating bottom pill that expands on demand.

---

## Design Decisions

| Axis | Old | New |
|---|---|---|
| Color mode | Dark (`#05080F` base) | Light (`#f5f7ff` → `#eef0f7` gradient) |
| Layout | 55/45 chat+portfolio split | Full-screen data bento grid |
| Chat position | Left panel (55%) | Floating bottom bar → expandable sheet |
| Typography | Syne + DM Sans + Geist Mono | `-apple-system` / SF Pro stack + system mono |
| Glass style | White-on-dark tint | White vibrancy (0.72 opacity + blur-24) |
| Accent system | Persona-reactive CSS var | Apple system palette, sparse use |

---

## Section 1: Foundation

### Background
Static multi-stop gradient covering full viewport:
```css
background: radial-gradient(ellipse at 20% 20%, #dde8ff 0%, #f0f4ff 40%, #eef0fa 100%);
```

### Glass Tiers
```
Primary glass:   rgba(255,255,255,0.72) + backdrop-blur-3xl + border rgba(255,255,255,0.85) + shadow 0 2px 20px rgba(0,0,0,0.06)
Secondary glass: rgba(255,255,255,0.55) + backdrop-blur-xl  + border rgba(255,255,255,0.70)
```

### Persona Accent Colors (Apple system palette)
```
conservative_retiree  →  #0071E3  (system blue)
aggressive_growth     →  #FF9500  (system orange)
young_professional    →  #AF52DE  (system purple)
institutional         →  #34C759  (system green)
```
Used only on: hero number, active pill indicator, chart stroke, send button.

### Typography
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
font-family-mono: "SF Mono", SFMono-Regular, ui-monospace, monospace;
```
- Hero value: 56px / weight 700 / tracking -0.02em
- Section labels: 11px / weight 600 / tracking 0.08em / uppercase / color `#6e6e73`
- Body/table text: 13px / weight 400–500 / color `#1c1c1e`
- Secondary text: `#48484a`

---

## Section 2: Layout & Components

### Top Bar (56px, full width)
- Secondary glass
- Left: `◎ WealthAgent` wordmark (SF Pro Semibold 15px, `#1c1c1e`)
- Center: Persona pills — `layoutId` sliding indicator spring animation; active pill uses `color-mix(persona-primary 15%, white)` background with `border: 1px solid color-mix(persona-primary 40%, transparent)`
- Right: Selected client name + persona badge
- `border-bottom: 1px solid rgba(0,0,0,0.06)`

### Scrollable Canvas (below top bar, above chat bar)
`overflow-y: auto`, `padding: 20px 24px`, `display: grid`, `gap: 16px`

#### Row 1: Hero + Metrics (auto height)
```
[Hero card — 50% width]  [Metric 2×2 grid — 50% width]
```

**Hero card** — Primary glass, `border-radius: 20px`, `padding: 24px`
- Label: "TOTAL VALUE" — 11px / uppercase / `#6e6e73`
- Value: `<NumberFlow>` — 56px / 700 / persona accent with `drop-shadow(0 0 24px color-mix(persona 35%, transparent))`
- Sub-row: YTD return pill (green/red) + "Client · Persona" in 13px secondary gray

**Metric cards** — Primary glass, `border-radius: 16px`, `padding: 16px 20px`, 2×2 grid
- `.magic-card` conic border on hover (keep — desaturated it's fine on light)
- `NumberFlow` values
- Framer Motion stagger `delay: i * 0.06`

#### Row 2: Performance Chart (full width, ~200px)
- Secondary glass, `border-radius: 16px`
- Section label "PERFORMANCE" top-left inside card
- Area chart, persona stroke + gradient fill, `animationDuration={800}`

#### Row 3: Allocation + Sector (50/50 split, ~220px)
- Both secondary glass
- Donut chart (left) — upgraded color palette `['#0071E3','#34C759','#FF9500','#AF52DE','#FF3B30','#00C7BE']`
- Horizontal bars (right) — persona fill, `animationDuration={700}`

#### Row 4: Holdings Table (full width, min 200px)
- Secondary glass
- Frosted sticky `<thead>` — `position: sticky; top: 0; backdrop-filter: blur(12px); background: rgba(255,255,255,0.90)`
- `AnimatePresence` sort rows (keep)
- Text: `#1c1c1e` tickers, `#6e6e73` values

### Floating Chat Bar
- Position: `fixed bottom-6 left-6 right-6` (24px margins all sides)
- Primary glass + `border-radius: 999px` (pill) + `box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`
- Height: `60px`, `padding: 0 20px`
- Left: `MessageCircle` icon (16px, `#6e6e73`) + input placeholder `"Ask AI about [name]'s portfolio…"`
- Right: Send button — `border-radius: 50%`, `background: persona-primary`, 36px, `ArrowUp` icon white
- **Expanded state:** `layoutId="chat-shell"` grows to a `70vh` frosted panel (`border-radius: 24px`) anchored at the bottom. Backdrop: `rgba(0,0,0,0.15)` on the canvas behind. Dismiss by clicking backdrop or pressing `Esc`.

---

## Section 3: Motion & Transitions

### Page / Client Switch
- Staggered card entrance: `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}`, spring `{stiffness: 280, damping: 28}`, delay `i * 0.06`
- Background gradient crossfades via `transition: background 1.2s ease`
- Persona accent crossfades via `@property --persona-primary` (already in CSS)
- `NumberFlow` rolls all values simultaneously

### Chat Bar Expansion
- `AnimatePresence` + `layout` on a shared `layoutId="chat-shell"` — pill expands to sheet
- Spring: `stiffness: 340, damping: 32`
- Backdrop `motion.div` fades in alongside

### Hover States
- Cards: `whileHover={{ y: -2 }}` + `box-shadow` deepens (no glow — clean for light mode)
- Pills: background tint opacity increases from 0 → 1 on hover

### Scrollbar
Light mode scrollbar: `scrollbar-color: rgba(0,0,0,0.15) transparent`

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/index.css` | New CSS foundation: light gradient bg, light glass utilities, light scrollbar, updated magic-card-inner bg |
| `frontend/tailwind.config.js` | Font family → system stack, add apple accent color tokens |
| `frontend/src/App.jsx` | New bento grid layout, fixed chat bar, remove divider, persona colors updated |
| `frontend/src/components/Chat/PersonaPills.jsx` | Adapt active pill for light mode |
| `frontend/src/components/Layout/RightPanel.jsx` | Dissolve — content extracted into App.jsx grid directly, or kept as scroll container |
| `frontend/src/components/Dashboard/MetricCards.jsx` | Light glass cards, update text colors |
| `frontend/src/components/Dashboard/AllocationChart.jsx` | Updated donut palette |
| `frontend/src/components/Dashboard/HoldingsTable.jsx` | Light table styles, sticky header |
| `frontend/src/components/Dashboard/PerformanceChart.jsx` | Light axis ticks |
| `frontend/src/components/Dashboard/SectorChart.jsx` | Light axis ticks |
| `frontend/src/components/Chat/ChatWindow.jsx` | Now renders inside expanded sheet |
| `frontend/src/components/Chat/ChatInput.jsx` | Adapts to light mode (dark placeholder text) |
| `frontend/src/components/Chat/MessageBubble.jsx` | Light bubble colors |
| `frontend/src/components/Chat/AgentIndicator.jsx` | Light mode text |
| `frontend/src/components/Chat/SuggestedPrompts.jsx` | Light glass chips |
