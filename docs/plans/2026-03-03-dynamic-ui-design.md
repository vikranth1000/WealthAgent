# Dynamic UI Revamp — "Kinetic" Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create implementation plan from this design doc.

**Goal:** Transform WealthAgent from static glassmorphism into a high-kinetic, Robinhood × Cash App × Skiper UI financial interface — persona-reactive accent system, Framer Motion spring physics, @number-flow rolling digit counters, and CSS conic-gradient magic borders.

**Aesthetic:** Cash App spatial discipline + Skiper UI motion energy. Clean idle state, alive on interaction.

**New Libraries:**
- `framer-motion` v11 — spring physics, layoutId, AnimatePresence, motion values
- `@number-flow/react` — rolling digit counter (Robinhood-style number animation)
- `sonner` — toast notifications replacing custom undo toast

---

## 1. Color & Depth

| Token | Value | Usage |
|-------|-------|-------|
| Base background | `#05080F` | True near-black, replaces `#0F172A` |
| Panel surface | `#090D1C` | Card/panel backgrounds |
| Elevated surface | `#0C1222` | Popovers, overlays |
| Border default | `rgba(255,255,255,0.06)` | All idle card borders |
| Border hover | `rgba(255,255,255,0.14)` | Hover state |
| Persona blue | `#3B82F6` | conservative_retiree |
| Persona amber | `#F59E0B` | aggressive_growth |
| Persona violet | `#A855F7` | young_professional (upgraded from #8B5CF6) |
| Persona teal | `#2DD4BF` | institutional |

CSS `@property --persona-primary` with `transition: 1.2s ease` on `:root` — already implemented, keep.

---

## 2. Typography Scale

| Role | Font | Size | Weight |
|------|------|------|--------|
| Hero portfolio value | Geist Mono | 64px | 600 |
| Section headers | Syne | 11px | 700, tracked 0.14em |
| Metric values | Geist Mono | 22px | 600 |
| Body / labels | DM Sans | 13px | 400 |
| Micro labels | DM Sans | 9px | 700, tracked 0.12em, uppercase |
| Mono data | Geist Mono | 12px | 400 |

Hero number glow: `filter: drop-shadow(0 0 24px color-mix(in srgb, var(--persona-primary) 45%, transparent))`

---

## 3. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [WealthAgent wordmark]  [● Margaret][● Alex][● Sarah][● OmniCap]│  44px persona bar
├────────────────────────────────────┬────────────────────────────┤
│                                    ║                            │
│  CHAT PANEL (55%)                  ║  PORTFOLIO PANEL (45%)     │
│  bg: #050810                       ║  bg: #07091A               │
│                                    ║                            │
│  ● connected dot + label           ║  PORTFOLIO (9px label)     │
│                                    ║  Client Name (Syne 20px)   │
│  [empty state or messages]         ║  persona type (muted)      │
│                                    ║  $X,XXX,XXX  ← @number-flow│
│                                    ║  +X.X% YTD badge           │
│                                    ║                            │
│                                    ║  ─ 2×2 metric cards ──    │
│                                    ║  ─ allocation chart ───   │
│                                    ║  ─ performance chart ──   │
│                                    ║  ─ sector chart ───────   │
│  [suggested prompts]               ║  ─ holdings table ──────  │
│  [⚡ Actions]  [input field]       ║                            │
└────────────────────────────────────║────────────────────────────┘
                                     ↑
                         Plasma divider: 1px width
                         box-shadow: 0 0 20px var(--persona-primary)/40%
```

**Background orbs:** 3 `motion.div` blobs, `3–4% opacity`, persona-colored, slow 12–16s drift animation. Color transitions with persona via `animate={{ backgroundColor }}`.

---

## 4. Persona Pill Bar

- Container: `44px` height, horizontal flex, border-bottom `rgba(255,255,255,0.06)`
- Active indicator: `motion.div` with `layoutId="active-pill"` — physically slides under active button, spring physics
- Active button: persona color text + icon, no explicit border (sliding bg is the indicator)
- Inactive: `text-slate-500`, transparent bg
- Sliding bg color: `color-mix(in srgb, var(--persona-primary) 12%, transparent)`
- Border radius: `9999px` (full pill)

---

## 5. Magic Border — CSS Technique

Applied on: metric cards (hover), chat input (focus), active persona pill (always).

```css
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes spin-angle {
  to { --angle: 360deg; }
}

.magic-border {
  position: relative;
  border-radius: inherit;
}

.magic-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(
    from var(--angle),
    transparent 0%,
    var(--persona-primary) 10%,
    transparent 20%
  );
  animation: spin-angle 3s linear infinite;
  z-index: -1;
}

.magic-border::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: calc(inherit - 1px);
  background: #090D1C; /* matches card bg */
  z-index: -1;
}
```

Toggle via CSS class: `.magic-border-active` added on hover/focus via JS.

---

## 6. Hero Portfolio Value

```jsx
import NumberFlow from '@number-flow/react'

<NumberFlow
  value={analysis.total_value}
  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
  className="font-mono text-[64px] font-semibold leading-none"
  style={{ color: 'var(--persona-primary)', filter: 'drop-shadow(...)' }}
/>
```

Digits roll vertically to new value on every client switch. No manual animation code needed.

---

## 7. Component Motion Specs

### Metric Cards
```jsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 280, damping: 28, delay: index * 0.06 }}
  whileHover={{ y: -2 }}
  className="magic-border-wrapper" // activates ::before on hover via CSS :hover
>
```

Metric values inside cards also use `<NumberFlow>` so they roll on client switch.

### Message Bubbles
```jsx
// In AnimatePresence wrapper:
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
```

Left accent border: `motion.div` with `scaleY: 0 → 1`, `originY: 0` (draws top-to-bottom).

### Agent Thinking Dots
```jsx
{[0, 1, 2].map((i) => (
  <motion.span
    key={i}
    animate={{ y: [0, -6, 0] }}
    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: 'easeInOut' }}
  />
))}
// Glow ring behind dots:
<motion.div
  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
  className="absolute inset-0 rounded-full"
  style={{ background: 'var(--persona-primary)' }}
/>
```

### Suggested Prompts
```jsx
<motion.div
  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
  initial="hidden"
  animate="show"
>
  {prompts.map(p => (
    <motion.button
      variants={{ hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    />
  ))}
</motion.div>
```

### Holdings Table Rows
```jsx
// Wrap tbody in AnimatePresence mode="popLayout"
// Each tr:
<motion.tr
  layout
  initial={{ opacity: 0, x: -8 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 8 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>
```

---

## 8. Page Load Choreography

All panels wrapped in `motion.div` with `initial`/`animate` props. Sequence:

1. **t=0ms** — Background orbs `opacity: 0 → 1`, `duration: 600ms ease`
2. **t=0ms** — Left chat panel `x: -8 → 0`, spring, `stiffness: 260, damping: 28`
3. **t=150ms** — Divider `scaleY: 0 → 1` from top, `duration: 500ms ease`
4. **t=150ms** — Right portfolio panel `x: 8 → 0`, spring
5. **t=300ms** — Persona pills stagger in, `0.04s` per pill
6. **t=400ms** — Metric cards stagger in, `0.06s` per card
7. **t=500ms** — Portfolio hero number rolls in via `@number-flow`

---

## 9. Client Switch Choreography

Triggered by `selectedClient` change:

1. Hero number rolls to new value — `@number-flow` handles automatically
2. Metric card values roll — `@number-flow` on each value
3. Background orb color transitions — CSS `@property` `1.2s ease`
4. Divider glow color transitions — CSS `@property`
5. Charts re-animate — Recharts `isAnimationActive` triggers on new `data` prop
6. Active persona pill indicator slides — Framer Motion `layoutId`

---

## 10. Toast Notifications (Sonner)

Replace custom undo toast with `sonner`:
```jsx
import { Toaster, toast } from 'sonner'

// In App.jsx root:
<Toaster position="bottom-left" theme="dark" />

// On clear chat:
toast('Chat cleared', {
  action: { label: 'Undo', onClick: restoreFn }
})
```

---

## 11. index.css Changes

- Base background: `#05080F` on `body` / `html`
- Add `@property --angle` + `@keyframes spin-angle` for magic border
- Add `.magic-border-active::before` class
- Keep existing `@property --persona-primary` and persona utilities
- Remove panel opacity from keyframes (already done)

---

## 12. Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add framer-motion, @number-flow/react, sonner |
| `frontend/src/index.css` | Deeper bg, magic border CSS, @property --angle |
| `frontend/src/App.jsx` | Framer Motion panel wrappers, orb animations, Toaster |
| `frontend/src/components/Chat/PersonaPills.jsx` | layoutId sliding indicator |
| `frontend/src/components/Chat/ChatWindow.jsx` | AnimatePresence messages, sonner |
| `frontend/src/components/Chat/MessageBubble.jsx` | motion.div, border draw animation |
| `frontend/src/components/Chat/ChatInput.jsx` | magic border on focus |
| `frontend/src/components/Chat/SuggestedPrompts.jsx` | staggered motion variants |
| `frontend/src/components/Chat/AgentIndicator.jsx` | motion dots + glow ring |
| `frontend/src/components/Layout/RightPanel.jsx` | NumberFlow hero value, stagger |
| `frontend/src/components/Dashboard/MetricCards.jsx` | magic border hover, NumberFlow values |
| `frontend/src/components/Dashboard/AllocationChart.jsx` | animation config |
| `frontend/src/components/Dashboard/PerformanceChart.jsx` | persona gradient fill |
| `frontend/src/components/Dashboard/SectorChart.jsx` | animation config |
| `frontend/src/components/Dashboard/HoldingsTable.jsx` | motion.tr AnimatePresence |
