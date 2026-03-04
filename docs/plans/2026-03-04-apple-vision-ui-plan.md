# Apple visionOS Light Glass UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign WealthAgent from dark glassmorphism 55/45 split into Apple visionOS-style light vibrancy bento-grid with data as the primary focus and chat as a floating bottom pill that expands to a 70vh sheet.

**Architecture:** Replace the duality layout with a full-screen scrollable bento grid (top bar → hero+metrics row → performance chart → allocation+sector row → holdings table). A new `ChatBar` component pins to the bottom as a frosted glass pill. All components switch from dark slate colors to Apple system colors (light glass, `#1c1c1e` text, `#6e6e73` secondary, `--persona-primary` persona accent on Apple system palette). New components: `HeroCard.jsx`, `ChatBar.jsx`. Deleted: `RightPanel.jsx`.

**Tech Stack:** React 18 + Vite + Tailwind CSS + Framer Motion v11 + @number-flow/react + Sonner + Recharts

---

### Task 1: CSS Foundation — Apple light glass system

**Files:**
- Modify: `frontend/src/index.css`

**Context:** Complete replacement. Keep `@property` declarations and `spin-angle` keyframe. Update `magic-card-inner` to white. Add `.apple-glass-primary`, `.apple-glass-secondary`, `.apple-label` utilities. Flip scrollbar to light mode. Remove the dark-only `persona-divider` utility (no longer needed in bento layout).

**Step 1: Replace the full contents of `frontend/src/index.css`**

```css
/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Animatable custom properties ─── */

@property --persona-primary {
  syntax: '<color>';
  inherits: true;
  initial-value: #0071E3;
}

@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

/* ─── Global base ─── */

html, body {
  background: #f0f4ff;
}

:root {
  --persona-primary: #0071E3;
  transition: --persona-primary 1.2s ease;
}

/* ─── Magic border (conic-gradient sweep — works in light mode at reduced opacity) ─── */

@keyframes spin-angle {
  to { --angle: 360deg; }
}

.magic-card {
  position: relative;
  padding: 1px;
  border-radius: 16px;
}

.magic-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: conic-gradient(
    from var(--angle),
    transparent 0%,
    color-mix(in srgb, var(--persona-primary) 90%, transparent) 8%,
    transparent 16%
  );
  animation: spin-angle 3s linear infinite;
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 0;
}

.magic-card:hover::before,
.magic-card--active::before {
  opacity: 0.55;
}

.magic-card-inner {
  position: relative;
  z-index: 1;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.92);
}

/* ─── Apple-style utilities ─── */

@layer utilities {
  /* Primary glass — hero card, metric cards */
  .apple-glass-primary {
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.88);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  /* Secondary glass — chart containers, top bar, holdings */
  .apple-glass-secondary {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.78);
    box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
  }

  /* Apple label style — 11px uppercase section titles */
  .apple-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6e6e73;
  }

  /* Persona utilities — updated for light mode */
  .persona-border {
    border: 1px solid color-mix(in srgb, var(--persona-primary) 25%, transparent);
  }

  .persona-border-glow {
    border: 1px solid color-mix(in srgb, var(--persona-primary) 40%, transparent);
    box-shadow: 0 0 12px color-mix(in srgb, var(--persona-primary) 20%, transparent);
  }

  .persona-bg-subtle {
    background: color-mix(in srgb, var(--persona-primary) 08%, white);
  }

  .persona-bg-medium {
    background: color-mix(in srgb, var(--persona-primary) 15%, white);
  }

  .persona-text {
    color: var(--persona-primary);
  }

  /* Legacy aliases (keep so old usages don't break during migration) */
  .glass-dark {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.78);
  }

  .glass-darker {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.42);
    border: 1px solid rgba(255, 255, 255, 0.62);
  }
}

/* ─── Light scrollbar ─── */

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.14) transparent;
}

*::-webkit-scrollbar { width: 4px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.14);
  border-radius: 9999px;
}
*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.24);
}
```

**Step 2: Verify build**

```bash
cd frontend && npm run build
```

Expected: `✓ built in ~Xs`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: Apple light glass CSS foundation"
```

---

### Task 2: Tailwind Config — Apple system font stack

**Files:**
- Modify: `frontend/tailwind.config.js`

**Context:** Swap custom font imports (Syne, DM Sans, Geist Mono) for the Apple system stack. This removes the Google Fonts dependency entirely — system fonts are faster and look more native on macOS.

**Step 1: Replace fontFamily section in `frontend/tailwind.config.js`**

Find:
```js
fontFamily: {
  sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
  display: ['Syne', 'system-ui', 'sans-serif'],
  mono: ['"Geist Mono"', 'monospace'],
},
```

Replace with:
```js
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
  display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
  mono: ['"SF Mono"', 'SFMono-Regular', 'ui-monospace', 'monospace'],
},
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/tailwind.config.js
git commit -m "feat: Apple system font stack in Tailwind"
```

---

### Task 3: HeroCard — new component

**Files:**
- Create: `frontend/src/components/Dashboard/HeroCard.jsx`

**Context:** The portfolio value + client info used to live in `RightPanel`'s header. In the new bento grid it gets its own card at top-left. Uses `NumberFlow` for rolling digit animation and a persona-accent glow filter on the hero number.

**Step 1: Create `frontend/src/components/Dashboard/HeroCard.jsx`**

```jsx
import NumberFlow from '@number-flow/react'
import { motion } from 'framer-motion'

export default function HeroCard({ client, analysis }) {
  return (
    <motion.div
      className="apple-glass-primary rounded-[20px] p-6 flex flex-col justify-between min-h-[148px]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <p className="apple-label">Total Value</p>

      <div className="mt-2">
        {analysis ? (
          <NumberFlow
            value={analysis.total_value ?? 0}
            format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
            className="font-semibold block"
            style={{
              fontSize: '3.25rem',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--persona-primary)',
              filter: 'drop-shadow(0 0 24px color-mix(in srgb, var(--persona-primary) 30%, transparent))',
            }}
          />
        ) : (
          <div className="h-12 w-56 rounded-xl bg-black/[0.06] animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-2.5 mt-4 flex-wrap">
        {client && (
          <span className="text-[13px] font-semibold" style={{ color: '#1c1c1e' }}>
            {client.name}
          </span>
        )}
        {analysis && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-mono"
            style={{
              color: analysis.total_return >= 0 ? '#34C759' : '#FF3B30',
              background: analysis.total_return >= 0
                ? 'rgba(52,199,89,0.12)'
                : 'rgba(255,59,48,0.12)',
            }}
          >
            {analysis.total_return >= 0 ? '+' : ''}
            {(analysis.total_return * 100).toFixed(1)}% YTD
          </span>
        )}
        {client && (
          <span className="text-[12px] capitalize" style={{ color: '#6e6e73' }}>
            {client.persona?.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </motion.div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Dashboard/HeroCard.jsx
git commit -m "feat: HeroCard component with NumberFlow rolling hero value"
```

---

### Task 4: ChatBar — floating pill + expandable sheet

**Files:**
- Create: `frontend/src/components/Chat/ChatBar.jsx`

**Context:** The new chat entry point. Renders as a frosted glass pill pinned to the bottom of the viewport (`fixed bottom-6 left-6 right-6`). Clicking it — or typing in the input — expands it via `AnimatePresence` into a 70vh frosted sheet that hosts the full `ChatWindow`.

**Step 1: Create `frontend/src/components/Chat/ChatBar.jsx`**

```jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ArrowUp, X } from 'lucide-react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatBar({ client, portfolioData }) {
  const [open, setOpen] = useState(false)

  const placeholder = client
    ? `Ask AI about ${client.name.split(' ')[0]}'s portfolio…`
    : 'Ask AI about this portfolio…'

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Pill */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="pill"
            className="fixed bottom-6 left-6 right-6 z-50 flex items-center gap-3 px-5 cursor-pointer select-none"
            style={{
              height: '60px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.92)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
            }}
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.35 }}
            whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)' }}
          >
            <MessageCircle size={16} style={{ color: '#6e6e73', flexShrink: 0 }} />
            <span className="flex-1 text-[14px]" style={{ color: '#6e6e73' }}>
              {placeholder}
            </span>
            <motion.button
              className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
              style={{ background: 'var(--persona-primary)' }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => { e.stopPropagation(); setOpen(true) }}
            >
              <ArrowUp size={15} color="white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            className="fixed bottom-6 left-6 right-6 z-50 flex flex-col overflow-hidden"
            style={{
              height: '70vh',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.92)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            {/* Sheet header */}
            <div
              className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b"
              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={14} style={{ color: 'var(--persona-primary)' }} />
                <span className="text-[13px] font-semibold" style={{ color: '#1c1c1e' }}>
                  {client ? `AI Assistant — ${client.name.split(' ')[0]}` : 'AI Assistant'}
                </span>
              </div>
              <motion.button
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ background: 'rgba(0,0,0,0.06)' }}
                whileHover={{ background: 'rgba(0,0,0,0.10)' }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(false)}
              >
                <X size={13} style={{ color: '#6e6e73' }} />
              </motion.button>
            </div>

            {/* Chat window */}
            <div className="flex-1 min-h-0">
              {client ? (
                <ChatWindow
                  client={client}
                  portfolioData={portfolioData}
                  onGeneratingChange={() => {}}
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-[13px]"
                  style={{ color: '#6e6e73' }}
                >
                  Select a client to begin
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/ChatBar.jsx
git commit -m "feat: ChatBar floating pill + AnimatePresence expandable 70vh sheet"
```

---

### Task 5: App.jsx — bento grid layout

**Files:**
- Modify: `frontend/src/App.jsx`

**Context:** Complete rewrite. Removes the 55/45 duality split, the glowing divider, and the animated background orbs. Builds the bento grid directly in App. `RightPanel` is no longer imported. `ChatBar` and `HeroCard` are added. Persona colors updated to Apple system palette.

**Step 1: Replace `frontend/src/App.jsx` entirely**

```jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import HeroCard from './components/Dashboard/HeroCard.jsx'
import MetricCards from './components/Dashboard/MetricCards.jsx'
import AllocationChart from './components/Dashboard/AllocationChart.jsx'
import PerformanceChart from './components/Dashboard/PerformanceChart.jsx'
import SectorChart from './components/Dashboard/SectorChart.jsx'
import HoldingsTable from './components/Dashboard/HoldingsTable.jsx'
import ChatBar from './components/Chat/ChatBar.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const PERSONA_COLORS = {
  conservative_retiree: '#0071E3',
  aggressive_growth: '#FF9500',
  young_professional: '#AF52DE',
  institutional: '#34C759',
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 28, delay: i * 0.06 },
  }),
}

function Section({ title, children }) {
  return (
    <div>
      {title && <p className="apple-label mb-3">{title}</p>}
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[20px] h-[148px] bg-white/50 animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[16px] bg-white/50 animate-pulse h-[68px]" />
          ))}
        </div>
      </div>
      {[192, 220, 180].map((h, i) => (
        <div key={i} className="rounded-[16px] bg-white/50 animate-pulse" style={{ height: h }} />
      ))}
    </div>
  )
}

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients, selectedClient])

  useEffect(() => {
    if (selectedClient && clients.length > 0) {
      const updated = clients.find((c) => c.id === selectedClient.id)
      if (updated && updated.totalValue !== selectedClient.totalValue) {
        setSelectedClient(updated)
      }
    }
  }, [clients, selectedClient])

  useEffect(() => {
    const color = PERSONA_COLORS[selectedClient?.persona] ?? '#0071E3'
    document.documentElement.style.setProperty('--persona-primary', color)
  }, [selectedClient?.persona])

  const { portfolio, analysis, performanceHistory, holdingsDetail, loading, error } = portfolioData

  const metrics = analysis
    ? {
        totalValue: analysis.total_value,
        ytdReturn: analysis.total_return,
        sharpe: analysis.sharpe_ratio,
        maxDrawdown: analysis.max_drawdown,
      }
    : {}

  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings ?? []

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col font-sans"
      style={{
        background: 'radial-gradient(ellipse at 20% 15%, #dde8ff 0%, #f0f4ff 45%, #eef0fa 100%)',
      }}
    >
      {/* Top bar */}
      <div
        className="shrink-0 z-30 relative apple-glass-secondary"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <PersonaPills
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
        />
      </div>

      {/* Scrollable bento canvas */}
      <main
        className="flex-1 overflow-y-auto relative z-10"
        style={{ paddingBottom: '96px' }}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div
            className="flex h-full items-center justify-center text-[13px]"
            style={{ color: '#6e6e73' }}
          >
            {error}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Row 1: Hero + Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <HeroCard client={selectedClient} analysis={analysis} />
              <MetricCards metrics={metrics} />
            </div>

            {/* Row 2: Performance chart (full width) */}
            <motion.div
              className="apple-glass-secondary rounded-[16px] p-5"
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              key={`${selectedClient?.id}-perf`}
            >
              <Section title="Performance">
                <PerformanceChart data={performanceHistory} />
              </Section>
            </motion.div>

            {/* Row 3: Allocation + Sector (50/50) */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="apple-glass-secondary rounded-[16px] p-5"
                custom={3}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                key={`${selectedClient?.id}-alloc`}
              >
                <Section title="Asset Allocation">
                  <AllocationChart data={analysis?.current_allocation} />
                </Section>
              </motion.div>
              <motion.div
                className="apple-glass-secondary rounded-[16px] p-5"
                custom={4}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                key={`${selectedClient?.id}-sector`}
              >
                <Section title="Sector Exposure">
                  <SectorChart data={analysis?.sector_breakdown} />
                </Section>
              </motion.div>
            </div>

            {/* Row 4: Holdings table (full width) */}
            <motion.div
              className="apple-glass-secondary rounded-[16px] p-5"
              custom={5}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              key={`${selectedClient?.id}-holdings`}
            >
              <Section title="Holdings">
                <HoldingsTable
                  holdings={displayHoldings}
                  enhanced={holdingsDetail.length > 0}
                />
              </Section>
            </motion.div>
          </div>
        )}
      </main>

      {/* Floating chat bar */}
      <ChatBar client={selectedClient} portfolioData={portfolioData} />

      <Toaster position="top-right" theme="light" />
    </div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: App.jsx bento grid layout — data-first, floating ChatBar"
```

---

### Task 6: PersonaPills — light mode

**Files:**
- Modify: `frontend/src/components/Chat/PersonaPills.jsx`

**Context:** Update colors for light background. Wordmark text `#1c1c1e`, inactive pills `#6e6e73`, active pill background uses `color-mix(persona 15%, white)`.

**Step 1: Replace `frontend/src/components/Chat/PersonaPills.jsx` entirely**

```jsx
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Briefcase, Building2, Sparkles } from 'lucide-react'

const PERSONA_META = {
  conservative_retiree: { label: 'Conservative', icon: Shield },
  aggressive_growth: { label: 'Aggressive', icon: TrendingUp },
  young_professional: { label: 'Young Pro', icon: Briefcase },
  institutional: { label: 'Institutional', icon: Building2 },
}

export default function PersonaPills({ clients, selectedClient, onSelectClient, loading }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 shrink-0">
      {/* Wordmark */}
      <div className="flex items-center gap-2 shrink-0 mr-1">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'color-mix(in srgb, var(--persona-primary) 12%, white)' }}
        >
          <Sparkles size={13} style={{ color: 'var(--persona-primary)' }} />
        </div>
        <span className="text-[15px] font-semibold" style={{ color: '#1c1c1e' }}>
          WealthAgent
        </span>
      </div>

      <div className="h-4 w-px shrink-0" style={{ background: 'rgba(0,0,0,0.10)' }} />

      {/* Client pills */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-black/[0.06] animate-pulse shrink-0" />
            ))}
          </>
        ) : (
          clients.map((client) => {
            const meta = PERSONA_META[client.persona] ?? { label: client.name, icon: Building2 }
            const Icon = meta.icon
            const isActive = selectedClient?.id === client.id
            const firstName = client.name.split(' ')[0]

            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 whitespace-nowrap z-0"
                style={{ color: isActive ? 'var(--persona-primary)' : '#6e6e73' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'color-mix(in srgb, var(--persona-primary) 12%, white)',
                      border: '1px solid color-mix(in srgb, var(--persona-primary) 30%, transparent)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={11} style={{ color: isActive ? 'var(--persona-primary)' : '#6e6e73', opacity: isActive ? 1 : 0.7 }} />
                <span style={{ opacity: isActive ? 1 : 0.8 }}>{firstName}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/PersonaPills.jsx
git commit -m "feat: PersonaPills light mode — Apple system colors"
```

---

### Task 7: MetricCards — Apple light glass

**Files:**
- Modify: `frontend/src/components/Dashboard/MetricCards.jsx`

**Context:** Switch `ytdReturn` and `maxDrawdown` from emerald/rose to Apple system green/red (`#34C759`, `#FF3B30`). `sharpe` from `#94A3B8` to `#48484a`. The `.magic-card-inner` background is already white from Task 1 CSS.

**Step 1: Replace `frontend/src/components/Dashboard/MetricCards.jsx` entirely**

```jsx
import { motion } from 'framer-motion'
import NumberFlow from '@number-flow/react'

const CARDS = [
  {
    key: 'totalValue',
    label: 'Total Value',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    color: () => 'var(--persona-primary)',
  },
  {
    key: 'ytdReturn',
    label: 'YTD Return',
    format: { style: 'percent', signDisplay: 'always', maximumFractionDigits: 1 },
    color: (v) => (v >= 0 ? '#34C759' : '#FF3B30'),
  },
  {
    key: 'sharpe',
    label: 'Sharpe Ratio',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    color: () => '#48484a',
  },
  {
    key: 'maxDrawdown',
    label: 'Max Drawdown',
    format: { style: 'percent', maximumFractionDigits: 1 },
    color: () => '#FF3B30',
  },
]

export default function MetricCards({ metrics = {} }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CARDS.map(({ key, label, format, color }, i) => {
        const value = metrics[key] ?? null

        return (
          <motion.div
            key={key}
            className="magic-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: i * 0.06 }}
            whileHover={{ y: -2 }}
          >
            <div className="magic-card-inner px-4 py-3 h-full">
              <p className="apple-label mb-2">{label}</p>
              {value != null ? (
                <NumberFlow
                  value={value}
                  format={format}
                  className="font-semibold leading-none"
                  style={{ fontSize: '22px', color: color(value) }}
                />
              ) : (
                <span className="font-semibold leading-none" style={{ fontSize: '22px', color: '#c7c7cc' }}>
                  —
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Dashboard/MetricCards.jsx
git commit -m "feat: MetricCards Apple light glass + system color values"
```

---

### Task 8: Charts — light mode axis, grid, tooltips + Apple palette

**Files:**
- Modify: `frontend/src/components/Dashboard/AllocationChart.jsx`
- Modify: `frontend/src/components/Dashboard/PerformanceChart.jsx`
- Modify: `frontend/src/components/Dashboard/SectorChart.jsx`

**Context:** Flip chart internals from dark slate to Apple light. Grid strokes: `rgba(0,0,0,0.06)`. Axis ticks: `#6e6e73`. Tooltips: white background, dark text. AllocationChart legend: `#6e6e73` text. AllocationChart color palette → Apple system palette.

#### AllocationChart.jsx

**Step 1: In `frontend/src/components/Dashboard/AllocationChart.jsx`, make these changes:**

Change colors array (line 5):
```jsx
const COLORS = ['#0071E3', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#00C7BE']
```

Change `PctLabel` text fill from `"#94A3B8"` to `"#6e6e73"`.

Change tooltip `contentStyle`:
```jsx
contentStyle={{
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: '12px',
  color: '#1c1c1e',
  fontSize: '12px',
  fontFamily: '-apple-system, sans-serif',
}}
```

Change legend text color from `text-slate-400` className to inline style:
```jsx
<span className="text-[11px] whitespace-nowrap" style={{ color: '#6e6e73' }}>{entry.name}</span>
<span className="text-[11px] font-medium tabular-nums ml-auto" style={{ color: '#48484a' }}>
```

#### PerformanceChart.jsx

**Step 2: In `frontend/src/components/Dashboard/PerformanceChart.jsx`, make these changes:**

Change both XAxis and YAxis tick fill from `'#475569'` to `'#6e6e73'`.

Change CartesianGrid stroke from `"rgba(255,255,255,0.06)"` to `"rgba(0,0,0,0.06)"`.

Change tooltip contentStyle:
```jsx
contentStyle={{
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: '12px',
  color: '#1c1c1e',
  fontSize: '12px',
  fontFamily: '-apple-system, sans-serif',
}}
labelStyle={{ marginBottom: 2, fontSize: '10px', color: '#6e6e73' }}
itemStyle={{ margin: 0, padding: 0, fontSize: '11px', color: 'var(--persona-primary)' }}
```

#### SectorChart.jsx

**Step 3: In `frontend/src/components/Dashboard/SectorChart.jsx`, make these changes:**

Change YAxis tick fill from `'#475569'` to `'#6e6e73'`.

Change CartesianGrid stroke from `"rgba(255,255,255,0.06)"` to `"rgba(0,0,0,0.06)"`.

Change LabelList style fill from `'#94A3B8'` to `'#6e6e73'`.

Change tooltip contentStyle same as PerformanceChart above.

**Step 4: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 5: Commit**

```bash
git add frontend/src/components/Dashboard/AllocationChart.jsx frontend/src/components/Dashboard/PerformanceChart.jsx frontend/src/components/Dashboard/SectorChart.jsx
git commit -m "feat: charts light mode — Apple palette, light axis ticks, white tooltips"
```

---

### Task 9: HoldingsTable — light mode + frosted sticky header

**Files:**
- Modify: `frontend/src/components/Dashboard/HoldingsTable.jsx`

**Context:** Flip all dark colors to light Apple system colors. Add sticky `thead` with frosted white background. The `AnimatePresence` sort animation stays intact.

**Step 1: Replace `frontend/src/components/Dashboard/HoldingsTable.jsx` entirely**

```jsx
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const BASE_COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'asset_class', label: 'Class' },
]

const ENHANCED_COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'current_price', label: 'Price' },
  { key: 'market_value', label: 'Value' },
  { key: 'unrealized_pnl', label: 'P&L' },
]

function SortIcon({ active, dir }) {
  if (!active) return <ChevronUp size={10} style={{ color: '#c7c7cc' }} />
  return dir === 'asc'
    ? <ChevronDown size={10} style={{ color: 'var(--persona-primary)' }} />
    : <ChevronUp size={10} style={{ color: 'var(--persona-primary)' }} />
}

function formatCell(key, value) {
  if (value == null) return '—'
  if (key === 'shares') return typeof value === 'number' ? value.toFixed(1) : value
  if (key === 'current_price') return `$${value.toFixed(2)}`
  if (key === 'market_value') return `$${Math.round(value).toLocaleString()}`
  if (key === 'unrealized_pnl') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}$${Math.round(value).toLocaleString()}`
  }
  if (key === 'unrealized_pnl_pct') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }
  return String(value)
}

export default function HoldingsTable({ holdings = [], enhanced = false }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  if (!holdings.length) {
    return (
      <div className="text-[13px] text-center py-6" style={{ color: '#6e6e73' }}>
        No holdings
      </div>
    )
  }

  const COLS = enhanced ? ENHANCED_COLS : BASE_COLS

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(255,255,255,0.90)',
            zIndex: 1,
          }}
        >
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                className="px-2 pb-2.5 text-left cursor-pointer select-none transition-colors"
                style={{ color: '#6e6e73' }}
                onClick={() => handleSort(key)}
              >
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout" initial={false}>
            {sorted.map((h, i) => (
              <motion.tr
                key={h.ticker || i}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.02 }}
                className="transition-colors cursor-default"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {COLS.map(({ key }) => (
                  <td
                    key={key}
                    className="px-2 py-2.5 font-mono text-xs"
                    style={{
                      color: key === 'ticker' ? '#1c1c1e' : '#48484a',
                      fontWeight: key === 'ticker' ? 600 : 400,
                    }}
                  >
                    {key === 'unrealized_pnl' ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          color: h[key] >= 0 ? '#34C759' : '#FF3B30',
                          background: h[key] >= 0 ? 'rgba(52,199,89,0.10)' : 'rgba(255,59,48,0.10)',
                        }}
                      >
                        {formatCell(key, h[key])}
                      </span>
                    ) : key === 'ticker' ? (
                      h.ticker
                    ) : (
                      formatCell(key, h[key])
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Dashboard/HoldingsTable.jsx
git commit -m "feat: HoldingsTable light mode, frosted sticky header"
```

---

### Task 10: Chat components — light mode

**Files:**
- Modify: `frontend/src/components/Chat/ChatInput.jsx`
- Modify: `frontend/src/components/Chat/MessageBubble.jsx`
- Modify: `frontend/src/components/Chat/AgentIndicator.jsx`
- Modify: `frontend/src/components/Chat/SuggestedPrompts.jsx`
- Modify: `frontend/src/components/Chat/ChatWindow.jsx`

**Context:** All chat components rendered inside the expanded ChatBar sheet. Update dark slate colors to Apple light palette. The magic-card-inner now has a white bg from Task 1 CSS, so the ChatInput focus border remains functional.

#### ChatInput.jsx

**Step 1: Replace `frontend/src/components/Chat/ChatInput.jsx` entirely**

```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Square } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder }) {
  const [focused, setFocused] = useState(false)

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) {
        onStop?.()
      } else {
        onSubmit?.()
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 magic-card ${focused ? 'magic-card--active' : ''}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled && !isGenerating}
          placeholder={placeholder ?? 'Ask WealthAgent…'}
          className="magic-card-inner w-full h-11 px-4 text-[13px] outline-none font-sans bg-transparent"
          style={{ color: '#1c1c1e' }}
        />
      </div>

      {isGenerating ? (
        <motion.button
          onClick={onStop}
          whileTap={{ scale: 0.92 }}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-all"
          style={{
            border: '1px solid rgba(255,59,48,0.30)',
            background: 'rgba(255,59,48,0.08)',
            color: '#FF3B30',
          }}
          title="Stop generating"
        >
          <Square size={14} className="fill-current" />
        </motion.button>
      ) : (
        <motion.button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{
            background: 'var(--persona-primary)',
            boxShadow: value?.trim()
              ? '0 0 16px color-mix(in srgb, var(--persona-primary) 40%, transparent)'
              : 'none',
          }}
          title="Send message"
        >
          <ArrowUp size={16} className="text-white" />
        </motion.button>
      )}
    </div>
  )
}
```

#### MessageBubble.jsx

**Step 2: Replace `frontend/src/components/Chat/MessageBubble.jsx` entirely**

```jsx
import { cloneElement } from 'react'
import { motion } from 'framer-motion'
import { parseBlocks } from './blockParser'
import { BLOCK_COMPONENTS, BlockSkeleton } from './blocks'

function parseInline(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let lastIndex = 0
  let match
  let idx = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[2]) parts.push(<strong key={idx++} style={{ color: '#1c1c1e', fontWeight: 600 }}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++} style={{ color: '#48484a' }}>{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code
          key={idx++}
          className="font-mono text-[12px] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.06)', color: '#1c1c1e' }}
        >
          {match[4]}
        </code>
      )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function renderMarkdown(content) {
  const lines = content.split('\n')
  const elements = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={k++} className="my-2 overflow-hidden rounded-lg" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          {lang && (
            <div
              className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide"
              style={{
                background: 'rgba(0,0,0,0.04)',
                color: '#6e6e73',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {lang}
            </div>
          )}
          <pre
            className="font-mono text-[12px] p-3 overflow-x-auto whitespace-pre"
            style={{ background: 'rgba(0,0,0,0.03)', color: '#1c1c1e' }}
          >
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={k++} className="font-semibold text-sm mt-2.5 mb-1" style={{ color: '#1c1c1e' }}>
          {parseInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={k++} className="font-bold text-base mt-3 mb-1.5" style={{ color: '#1c1c1e' }}>
          {parseInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={k++} className="ml-1 my-1.5 list-inside list-disc space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed" style={{ color: '#48484a' }}>{parseInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={k++} className="ml-1 my-1.5 list-inside list-decimal space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed" style={{ color: '#48484a' }}>{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />)
      i++
      continue
    }

    if (line.trim() === '') {
      elements.push(<div key={k++} className="h-2" />)
      i++
      continue
    }

    elements.push(
      <p key={k++} className="my-0.5 leading-6" style={{ color: '#48484a' }}>
        {parseInline(line)}
      </p>
    )
    i++
  }
  return elements
}

const cursor = (
  <span
    className="inline-block ml-0.5 h-3.5 w-0.5 rounded-full animate-pulse"
    style={{ background: 'var(--persona-primary)' }}
  />
)

function appendCursor(elements) {
  if (!elements.length) return [cursor]
  const last = elements[elements.length - 1]
  if (last && last.props?.children != null) {
    const children = Array.isArray(last.props.children) ? last.props.children : [last.props.children]
    const patched = cloneElement(last, {}, ...children, cursor)
    return [...elements.slice(0, -1), patched]
  }
  return [...elements, cursor]
}

function renderContent(content, isStreaming) {
  const segments = parseBlocks(content, isStreaming)
  const elements = []

  segments.forEach((seg, idx) => {
    if (seg.type === 'text') {
      elements.push(<div key={idx}>{renderMarkdown(seg.content)}</div>)
    } else if (seg.type === 'pending-block') {
      elements.push(<BlockSkeleton key={idx} blockType={seg.blockType} />)
    } else {
      const Block = BLOCK_COMPONENTS[seg.type]
      if (Block) {
        elements.push(
          <div key={idx} className="my-2 -mx-1">
            <Block data={seg.data} />
          </div>
        )
      }
    }
  })

  return elements
}

const bubbleSpring = { type: 'spring', stiffness: 300, damping: 30 }

export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'

  let rendered = isUser ? null : renderContent(content, streaming)
  if (streaming && rendered) rendered = appendCursor(rendered)

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end mb-3"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={bubbleSpring}
      >
        <div
          className="max-w-[68%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[13px] font-sans leading-relaxed text-white"
          style={{ background: 'var(--persona-primary)' }}
        >
          {content}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="flex justify-start mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={bubbleSpring}
      >
        <div
          className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] font-sans"
          style={{
            color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.20)',
            background: 'rgba(255,59,48,0.06)',
          }}
        >
          {rendered}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex justify-start mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={bubbleSpring}
    >
      <div className="relative max-w-[78%] flex">
        {/* Left accent border */}
        <motion.div
          className="w-[3px] rounded-full shrink-0 mr-3 self-stretch"
          style={{
            background: 'color-mix(in srgb, var(--persona-primary) 50%, transparent)',
            originY: 0,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        />
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] font-sans leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.80)',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#48484a',
          }}
        >
          {rendered}
        </div>
      </div>
    </motion.div>
  )
}
```

#### AgentIndicator.jsx

**Step 3: In `frontend/src/components/Chat/AgentIndicator.jsx`, change only the label color:**

Find:
```jsx
<span className="text-xs text-slate-500 font-sans">{label}…</span>
```

Replace with:
```jsx
<span className="text-xs font-sans" style={{ color: '#6e6e73' }}>{label}…</span>
```

#### SuggestedPrompts.jsx

**Step 4: Replace the chip button className/style in `frontend/src/components/Chat/SuggestedPrompts.jsx`:**

Find:
```jsx
className="rounded-full border border-white/[0.10] bg-transparent px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300 hover:border-white/[0.22] hover:bg-white/[0.04] font-sans whitespace-nowrap"
style={isDynamic ? { borderColor: 'color-mix(in srgb, var(--persona-primary) 25%, rgba(255,255,255,0.10))' } : {}}
```

Replace with:
```jsx
className="rounded-full px-3 py-1.5 text-xs font-sans whitespace-nowrap transition-colors"
style={{
  color: '#48484a',
  border: isDynamic
    ? '1px solid color-mix(in srgb, var(--persona-primary) 25%, rgba(0,0,0,0.10))'
    : '1px solid rgba(0,0,0,0.10)',
  background: 'rgba(255,255,255,0.70)',
}}
```

#### ChatWindow.jsx

**Step 5: In `frontend/src/components/Chat/ChatWindow.jsx`, update the dark-mode hardcoded values:**

Change the connection status + clear row background — find the input area wrapper:
```jsx
<div className="shrink-0 border-t border-white/[0.06] bg-[#080D1A]/60">
```
Replace with:
```jsx
<div className="shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.60)' }}>
```

Change the Actions popover container background from `bg-[#0F1929]` to:
```jsx
className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl overflow-hidden z-50 animate-slide-up"
style={{
  border: '1px solid rgba(0,0,0,0.10)',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
}}
```

Change the Actions popover header text from `text-slate-600` to inline style `color: '#6e6e73'` and the close button from `text-slate-600 hover:text-slate-400` to `style={{ color: '#6e6e73' }}`.

Change each Action item text:
- `text-slate-300` → `style={{ color: '#1c1c1e' }}`
- `text-slate-600` → `style={{ color: '#6e6e73' }}`
- Icon button background `bg-white/[0.06] group-hover:bg-white/[0.10]` → `style={{ background: 'rgba(0,0,0,0.05)' }}` with hover `rgba(0,0,0,0.08)`

Change Actions button when inactive from `border-white/[0.10] bg-white/[0.04] text-slate-500 hover:border-white/[0.18] hover:text-slate-300` to:
```jsx
style={{ border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.60)', color: '#6e6e73' }}
```

Change Actions button when active from `border-white/20 bg-white/[0.08] text-slate-200` to:
```jsx
style={{ border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.80)', color: '#1c1c1e' }}
```

Change the empty state icon container from `bg-white/[0.06] border border-white/[0.08]` to `style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}`.

Change the empty state heading from `text-slate-300` to `style={{ color: '#1c1c1e' }}`.

Change the empty state paragraph from `text-slate-600` to `style={{ color: '#6e6e73' }}`.

Change clear button from `text-slate-600 hover:text-rose-400` to `style={{ color: '#6e6e73' }}`.

**Step 6: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 7: Commit**

```bash
git add frontend/src/components/Chat/ChatInput.jsx frontend/src/components/Chat/MessageBubble.jsx frontend/src/components/Chat/AgentIndicator.jsx frontend/src/components/Chat/SuggestedPrompts.jsx frontend/src/components/Chat/ChatWindow.jsx
git commit -m "feat: chat components light mode — Apple system colors throughout"
```

---

### Task 11: Cleanup — delete RightPanel

**Files:**
- Delete: `frontend/src/components/Layout/RightPanel.jsx`

**Context:** `RightPanel` is now unused. `App.jsx` imports components directly. Delete it.

**Step 1: Delete the file**

```bash
rm frontend/src/components/Layout/RightPanel.jsx
```

**Step 2: Verify build — confirm no import errors**

```bash
npm run build
```

Expected: `✓ built`, no errors. If you see `RightPanel` import errors, search `frontend/src` for any remaining imports and remove them.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove RightPanel (dissolved into App.jsx bento grid)"
```

---

### Task 12: Final verification

**Step 1: Full build**

```bash
cd frontend && npm run build
```

Expected: `✓ built in ~Xs`, no errors, no missing module warnings.

**Step 2: Dev server smoke test**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- [ ] Background is a soft blue-white gradient (not dark)
- [ ] Top bar is frosted glass with WealthAgent wordmark + 4 persona pills
- [ ] Bento grid shows hero card + 2×2 metric cards in row 1
- [ ] Performance area chart renders in row 2
- [ ] Allocation donut + sector bars in row 3
- [ ] Holdings table with sticky frosted header in row 4
- [ ] Floating frosted pill at bottom with "Ask AI about…" placeholder
- [ ] Clicking pill expands to 70vh chat sheet with smooth spring animation
- [ ] Clicking backdrop or X closes the sheet
- [ ] Switching client persona → accent color transitions smoothly, NumberFlow rolls, charts re-animate
- [ ] Holdings table sort → rows animate with spring reorder

**Step 3: Commit if any last fixes were needed**

```bash
git add -A
git commit -m "fix: final light mode polish from smoke test"
```

---

## Summary

| Task | Files | Change |
|---|---|---|
| 1 | index.css | Light glass CSS foundation |
| 2 | tailwind.config.js | Apple system fonts |
| 3 | HeroCard.jsx (new) | Rolling hero portfolio value card |
| 4 | ChatBar.jsx (new) | Floating pill + 70vh expandable sheet |
| 5 | App.jsx | Bento grid layout, remove duality split |
| 6 | PersonaPills.jsx | Light mode |
| 7 | MetricCards.jsx | Light glass + Apple system colors |
| 8 | 3 chart files | Light axes, grids, tooltips, Apple palette |
| 9 | HoldingsTable.jsx | Light mode + sticky frosted header |
| 10 | 5 chat files | Light mode throughout |
| 11 | RightPanel.jsx | Delete (unused) |
| 12 | — | Final build + smoke test |
