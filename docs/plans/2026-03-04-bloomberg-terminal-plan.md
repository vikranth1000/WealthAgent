# Bloomberg Terminal UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform WealthAgent from Apple glass to a Bloomberg Terminal aesthetic — near-black background, amber (#FF9900) monospace text, maximum data density, pure flat 2D with no blur/shadow/border-radius.

**Architecture:** Complete visual replacement. App.jsx gets a fixed-viewport grid layout (no scroll) with a 260px left sidebar, right panel area split into performance/sector/holdings, and a 42px console bar at bottom. Chat becomes a flat 2D rectangle panel that slides up from the console bar. All glass utilities removed from CSS. All components switch to monospace terminal colors.

**Tech Stack:** React 18 + Vite + Tailwind CSS + Framer Motion v11 (slide animation only) + Recharts + Sonner

---

## Pre-Implementation Notes

Patterns to ELIMINATE completely:
- `apple-glass-primary`, `apple-glass-secondary`, `magic-card`, `magic-card-inner`, `glass-dark` CSS classes
- `backdrop-filter`, `box-shadow`, `border-radius > 0` on any panel
- Framer Motion spring/scale entrance animations on data panels
- `NumberFlow` (used in HeroCard + MetricCards — both files are deleted)
- `@number-flow/react` imports

Design tokens for every component:
- Background: `#0D0D0D`
- Panel bg: `#111111`
- Borders: `1px solid #1E1E1E`
- Amber accent: `#FF9900`
- Primary text: `#FFFFFF`
- Secondary text: `#888888`
- Positive: `#00C805`
- Negative: `#FF3B30`
- Font: `SF Mono, SFMono-Regular, Courier New, monospace` everywhere

---

### Task 1: CSS Foundation — terminal variables, remove glass

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Replace `frontend/src/index.css` entirely**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Terminal design tokens ─── */

:root {
  --persona-primary: #FF9900;
  --bg: #0D0D0D;
  --panel: #111111;
  --border: #1E1E1E;
  --amber: #FF9900;
  --text-primary: #FFFFFF;
  --text-secondary: #888888;
  --green: #00C805;
  --red: #FF3B30;
}

html, body {
  background: #0D0D0D;
  color: #FFFFFF;
  height: 100vh;
  overflow: hidden;
  font-family: 'SF Mono', SFMono-Regular, 'Courier New', Courier, monospace;
}

/* ─── Terminal scrollbar ─── */

* {
  scrollbar-width: thin;
  scrollbar-color: #333333 transparent;
}

*::-webkit-scrollbar { width: 4px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background-color: #333333;
  border-radius: 0;
}
*::-webkit-scrollbar-thumb:hover {
  background-color: #555555;
}
```

**Step 2: Verify build**

```bash
cd frontend && npm run build
```

Expected: `✓ built`, no errors.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: Bloomberg terminal CSS foundation"
```

---

### Task 2: Tailwind Config — monospace font stack

**Files:**
- Modify: `frontend/tailwind.config.js`

**Step 1: Find the `fontFamily` block and replace it**

Find:
```js
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
  display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
  mono: ['"SF Mono"', 'SFMono-Regular', 'ui-monospace', 'monospace'],
},
```

Replace with:
```js
fontFamily: {
  sans: ['"SF Mono"', 'SFMono-Regular', '"Courier New"', 'Courier', 'monospace'],
  display: ['"SF Mono"', 'SFMono-Regular', '"Courier New"', 'Courier', 'monospace'],
  mono: ['"SF Mono"', 'SFMono-Regular', '"Courier New"', 'Courier', 'monospace'],
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
git commit -m "feat: monospace terminal font stack"
```

---

### Task 3: App.jsx — terminal fixed-viewport layout

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Replace `frontend/src/App.jsx` entirely**

```jsx
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import PerformanceChart from './components/Dashboard/PerformanceChart.jsx'
import SectorChart from './components/Dashboard/SectorChart.jsx'
import HoldingsTable from './components/Dashboard/HoldingsTable.jsx'
import ChatBar from './components/Chat/ChatBar.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

function SectionHeader({ children }) {
  return (
    <div
      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shrink-0"
      style={{ color: '#FF9900', borderBottom: '1px solid #1E1E1E' }}
    >
      {children}
    </div>
  )
}

function MetricRow({ label, value, valueColor }) {
  const total = 22
  const dots = '·'.repeat(Math.max(1, total - label.length - String(value ?? '—').length))
  return (
    <div className="flex items-baseline text-[12px] font-mono leading-5">
      <span style={{ color: '#888888' }}>{label}</span>
      <span className="flex-1" style={{ color: '#2A2A2A', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {dots}
      </span>
      <span style={{ color: valueColor ?? '#FFFFFF' }}>{value ?? '—'}</span>
    </div>
  )
}

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) setSelectedClient(clients[0])
  }, [clients, selectedClient])

  useEffect(() => {
    document.documentElement.style.setProperty('--persona-primary', '#FF9900')
  }, [])

  const { portfolio, analysis, performanceHistory, holdingsDetail, loading } = portfolioData
  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings ?? []

  const alloc = analysis?.current_allocation
    ? Object.entries(analysis.current_allocation)
        .filter(([, v]) => v > 0.001)
        .sort((a, b) => b[1] - a[1])
    : []

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden font-mono"
      style={{ background: '#0D0D0D', color: '#FFFFFF' }}
    >
      {/* ── Top bar ── */}
      <div
        className="shrink-0 flex items-center"
        style={{ height: '40px', background: '#111111', borderBottom: '1px solid #1E1E1E' }}
      >
        <div
          className="shrink-0 flex items-center px-4 h-full"
          style={{ borderRight: '1px solid #1E1E1E' }}
        >
          <span
            className="text-[11px] font-bold tracking-[0.15em] uppercase"
            style={{ color: '#FF9900' }}
          >
            ▸ WEALTHAGENT
          </span>
        </div>
        <PersonaPills
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
        />
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar */}
        <div
          className="shrink-0 flex flex-col overflow-y-auto"
          style={{ width: '260px', borderRight: '1px solid #1E1E1E', background: '#111111' }}
        >
          {/* Portfolio summary */}
          <SectionHeader>Portfolio</SectionHeader>
          <div className="px-3 py-3 shrink-0">
            <div className="text-[12px] font-bold" style={{ color: '#FFFFFF' }}>
              {selectedClient?.name ?? '—'}
            </div>
            <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: '#888888' }}>
              {selectedClient?.persona?.replace(/_/g, ' ') ?? ''}
            </div>
            <div
              className="font-bold leading-none mt-3"
              style={{ fontSize: '1.9rem', color: '#FF9900', letterSpacing: '-0.02em' }}
            >
              {loading
                ? '———'
                : analysis
                ? `$${Math.round(analysis.total_value).toLocaleString()}`
                : '—'}
            </div>
            {analysis && (
              <div
                className="text-[12px] mt-1 font-mono"
                style={{ color: analysis.total_return >= 0 ? '#00C805' : '#FF3B30' }}
              >
                {analysis.total_return >= 0 ? '+' : ''}
                {(analysis.total_return * 100).toFixed(1)}% YTD
              </div>
            )}
          </div>

          {/* Key metrics */}
          <SectionHeader>Key Metrics</SectionHeader>
          <div className="px-3 py-2.5 flex flex-col gap-1.5 shrink-0">
            {loading ? (
              <div className="text-[11px]" style={{ color: '#444444' }}>LOADING...</div>
            ) : analysis ? (
              <>
                <MetricRow
                  label="YTD RETURN"
                  value={`${analysis.total_return >= 0 ? '+' : ''}${(analysis.total_return * 100).toFixed(1)}%`}
                  valueColor={analysis.total_return >= 0 ? '#00C805' : '#FF3B30'}
                />
                <MetricRow
                  label="SHARPE RATIO"
                  value={analysis.sharpe_ratio?.toFixed(2)}
                />
                <MetricRow
                  label="MAX DRAWDOWN"
                  value={`${(analysis.max_drawdown * 100).toFixed(1)}%`}
                  valueColor="#FF3B30"
                />
                <MetricRow
                  label="TOTAL VALUE"
                  value={`$${(analysis.total_value / 1000).toFixed(0)}K`}
                />
              </>
            ) : (
              <div className="text-[11px]" style={{ color: '#444444' }}>NO DATA</div>
            )}
          </div>

          {/* Allocation text bars */}
          <SectionHeader>Allocation</SectionHeader>
          <div className="px-3 py-2.5 flex-1">
            {alloc.length === 0 ? (
              <div className="text-[11px]" style={{ color: '#444444' }}>
                {loading ? 'LOADING...' : 'NO DATA'}
              </div>
            ) : (
              alloc.map(([name, value]) => {
                const pct = Math.round(value * 100)
                const filled = Math.round((pct / 100) * 10)
                const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
                return (
                  <div key={name} className="mb-2.5">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span style={{ color: '#888888' }}>
                        {name.toUpperCase().slice(0, 14)}
                      </span>
                      <span style={{ color: '#FFFFFF' }}>{pct}%</span>
                    </div>
                    <div className="text-[11px] tracking-tight" style={{ color: '#FF9900' }}>
                      {bar}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">

          {/* Performance chart */}
          <div
            className="shrink-0 flex flex-col"
            style={{ height: '200px', borderBottom: '1px solid #1E1E1E' }}
          >
            <SectionHeader>Performance</SectionHeader>
            <div className="flex-1 min-h-0">
              <PerformanceChart data={performanceHistory} />
            </div>
          </div>

          {/* Bottom split: sector + holdings */}
          <div className="flex flex-1 min-h-0">

            {/* Sector exposure */}
            <div
              className="shrink-0 flex flex-col overflow-hidden"
              style={{ width: '38%', borderRight: '1px solid #1E1E1E' }}
            >
              <SectionHeader>Sector Exposure</SectionHeader>
              <div className="flex-1 overflow-hidden">
                <SectorChart data={analysis?.sector_breakdown} />
              </div>
            </div>

            {/* Holdings table */}
            <div className="flex-1 flex flex-col min-w-0">
              <SectionHeader>Holdings</SectionHeader>
              <div className="flex-1 overflow-y-auto">
                <HoldingsTable
                  holdings={displayHoldings}
                  enhanced={holdingsDetail.length > 0}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Console bar + chat overlay */}
      <ChatBar client={selectedClient} portfolioData={portfolioData} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111111',
            border: '1px solid #1E1E1E',
            color: '#FFFFFF',
            fontFamily: 'monospace',
            borderRadius: 0,
            fontSize: '12px',
          },
        }}
      />
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
git commit -m "feat: App.jsx terminal fixed-viewport layout"
```

---

### Task 4: ChatBar.jsx — console bar + 2D flat overlay

**Files:**
- Modify: `frontend/src/components/Chat/ChatBar.jsx`

**Step 1: Replace `frontend/src/components/Chat/ChatBar.jsx` entirely**

```jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatBar({ client, portfolioData }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [open])

  const placeholder = client
    ? `Ask about ${client.name.split(' ')[0]}'s portfolio...`
    : 'Select a client to begin...'

  return (
    <>
      {/* 2D flat chat panel — slides up from console bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="terminal-chat"
            className="fixed left-0 right-0 z-50 flex flex-col"
            style={{
              bottom: '42px',
              height: '60vh',
              background: '#111111',
              borderTop: '1px solid #FF9900',
              borderLeft: '1px solid #FF9900',
              borderRight: '1px solid #FF9900',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          >
            {/* Panel header */}
            <div
              className="shrink-0 flex items-center justify-between px-4"
              style={{ height: '32px', borderBottom: '1px solid #1E1E1E' }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: '#FF9900' }}
              >
                AI CONSOLE{client ? ` — ${client.name.split(' ')[0].toUpperCase()}` : ''}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] font-mono transition-colors"
                style={{ color: '#888888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FF9900')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                [X]
              </button>
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
                  className="flex h-full items-center justify-center text-[11px] font-mono"
                  style={{ color: '#444444' }}
                >
                  NO CLIENT SELECTED
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console bar — always visible */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 relative z-50"
        style={{
          height: '42px',
          background: '#111111',
          borderTop: `1px solid ${open ? '#FF9900' : '#1E1E1E'}`,
        }}
      >
        {/* Connection dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: '#00C805' }}
          />
          <span className="text-[10px] font-mono" style={{ color: '#444444' }}>
            READY
          </span>
        </div>

        {/* Prompt */}
        <span className="text-[13px] shrink-0 font-mono" style={{ color: '#FF9900' }}>
          {'>'}
        </span>

        {/* Input trigger */}
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[13px] font-mono cursor-pointer"
          style={{ color: '#444444' }}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
        />

        {/* Actions button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono transition-colors"
          style={{ border: '1px solid #1E1E1E', color: '#888888', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FF9900'
            e.currentTarget.style.color = '#FF9900'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1E1E1E'
            e.currentTarget.style.color = '#888888'
          }}
        >
          <Zap size={10} />
          CHAT
        </button>
      </div>
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
git commit -m "feat: ChatBar terminal console bar + 2D flat overlay"
```

---

### Task 5: PersonaPills.jsx — F-key terminal tabs

**Files:**
- Modify: `frontend/src/components/Chat/PersonaPills.jsx`

**Step 1: Replace `frontend/src/components/Chat/PersonaPills.jsx` entirely**

```jsx
export default function PersonaPills({ clients, selectedClient, onSelectClient, loading }) {
  if (loading) {
    return (
      <div className="flex items-center h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center h-full px-4 text-[11px] font-mono"
            style={{ borderRight: '1px solid #1E1E1E', color: '#333333' }}
          >
            F{i}: ——
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center h-full">
      {clients.map((client, i) => {
        const isActive = client.id === selectedClient?.id
        return (
          <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="flex items-center h-full px-4 text-[11px] font-mono transition-colors"
            style={{
              borderRight: '1px solid #1E1E1E',
              background: isActive ? 'rgba(255,153,0,0.08)' : 'transparent',
              color: isActive ? '#FF9900' : '#888888',
              borderBottom: isActive ? '2px solid #FF9900' : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = '#CC7A00'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = '#888888'
            }}
          >
            <span style={{ color: isActive ? '#CC7A00' : '#444444' }}>F{i + 1}:</span>
            <span className="ml-1">{client.name.split(' ')[0].toUpperCase()}</span>
          </button>
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
git add frontend/src/components/Chat/PersonaPills.jsx
git commit -m "feat: PersonaPills terminal F-key tab style"
```

---

### Task 6: PerformanceChart.jsx — terminal amber line

**Files:**
- Modify: `frontend/src/components/Dashboard/PerformanceChart.jsx`

**Step 1: Replace `frontend/src/components/Dashboard/PerformanceChart.jsx` entirely**

```jsx
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from 'recharts'

function formatYTick(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function formatXTick(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '")
}

function formatTooltipValue(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

export default function PerformanceChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] font-mono" style={{ color: '#444444' }}>
        NO DATA
      </div>
    )
  }

  const lastPoint = data[data.length - 1]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9900" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#FF9900" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 4" stroke="#1E1E1E" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#1E1E1E' }}
          tickFormatter={formatXTick}
          interval="preserveStartEnd"
          tickCount={6}
        />
        <YAxis
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          tickFormatter={formatYTick}
          width={52}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [formatTooltipValue(v), 'VALUE']}
          contentStyle={{
            background: '#111111',
            border: '1px solid #FF9900',
            borderRadius: 0,
            color: '#FFFFFF',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
          labelStyle={{ color: '#FF9900', fontSize: '10px', marginBottom: '2px' }}
          itemStyle={{ color: '#FFFFFF' }}
          cursor={{ stroke: '#FF9900', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FF9900"
          strokeWidth={1.5}
          fill="url(#perfGradient)"
          dot={false}
          isAnimationActive={false}
        />
        {lastPoint && (
          <ReferenceDot
            x={lastPoint.date}
            y={lastPoint.value}
            r={3}
            fill="#FF9900"
            stroke="#0D0D0D"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
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
git add frontend/src/components/Dashboard/PerformanceChart.jsx
git commit -m "feat: PerformanceChart terminal amber line, 6-tick x-axis"
```

---

### Task 7: SectorChart.jsx — terminal amber bars

**Files:**
- Modify: `frontend/src/components/Dashboard/SectorChart.jsx`

**Step 1: Replace `frontend/src/components/Dashboard/SectorChart.jsx` entirely**

```jsx
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useAnimatedObject } from '../../hooks/useAnimatedValue'

export default function SectorChart({ data }) {
  const animated = useAnimatedObject(data, 400)
  const targetKeys = useMemo(() => new Set(data ? Object.keys(data) : []), [data])

  const chartData = useMemo(() => {
    if (!animated || Object.keys(animated).length === 0) return []
    return Object.entries(animated)
      .filter(([name, value]) => value > 0.001 && targetKeys.has(name))
      .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
      .sort((a, b) => (data[b.name] ?? 0) - (data[a.name] ?? 0))
  }, [animated, targetKeys])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] font-mono" style={{ color: '#444444' }}>
        NO DATA
      </div>
    )
  }

  const height = Math.max(80, Object.keys(data).length * 28 + 16)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="1 4" stroke="#1E1E1E" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={92}
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => `${v.toFixed(1)}%`}
          contentStyle={{
            background: '#111111',
            border: '1px solid #FF9900',
            borderRadius: 0,
            color: '#FFFFFF',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
          cursor={{ fill: 'rgba(255,153,0,0.05)' }}
        />
        <Bar dataKey="value" fill="#FF9900" radius={0} isAnimationActive={false}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v.toFixed(1)}%`}
            style={{ fontSize: 10, fill: '#FF9900', fontFamily: 'monospace' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
git add frontend/src/components/Dashboard/SectorChart.jsx
git commit -m "feat: SectorChart terminal amber bars"
```

---

### Task 8: HoldingsTable.jsx — terminal style, no animation

**Files:**
- Modify: `frontend/src/components/Dashboard/HoldingsTable.jsx`

**Step 1: Replace `frontend/src/components/Dashboard/HoldingsTable.jsx` entirely**

```jsx
import { useState } from 'react'

const BASE_COLS = [
  { key: 'ticker', label: 'TICKER' },
  { key: 'shares', label: 'SHARES' },
  { key: 'asset_class', label: 'CLASS' },
]

const ENHANCED_COLS = [
  { key: 'ticker', label: 'TICKER' },
  { key: 'shares', label: 'SHARES' },
  { key: 'current_price', label: 'PX' },
  { key: 'market_value', label: 'VALUE' },
  { key: 'unrealized_pnl', label: 'P&L' },
]

function formatCell(key, value) {
  if (value == null) return '—'
  if (key === 'shares') return typeof value === 'number' ? value.toFixed(1) : value
  if (key === 'current_price') return `$${value.toFixed(2)}`
  if (key === 'market_value') return `$${Math.round(value).toLocaleString()}`
  if (key === 'unrealized_pnl') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}$${Math.round(value).toLocaleString()}`
  }
  return String(value)
}

export default function HoldingsTable({ holdings = [], enhanced = false }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  const COLS = enhanced ? ENHANCED_COLS : BASE_COLS

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  if (!holdings.length) {
    return (
      <div className="px-3 py-4 text-[11px] font-mono" style={{ color: '#444444' }}>
        NO HOLDINGS
      </div>
    )
  }

  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0, background: '#111111', zIndex: 1 }}>
        <tr style={{ borderBottom: '1px solid #1E1E1E' }}>
          {COLS.map(({ key, label }) => (
            <th
              key={key}
              className="px-3 py-1.5 text-left cursor-pointer select-none text-[10px] uppercase tracking-wider font-mono"
              style={{ color: sortKey === key ? '#FF9900' : '#888888' }}
              onClick={() => handleSort(key)}
            >
              {label}{sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((h, i) => (
          <tr
            key={h.ticker || i}
            style={{ borderBottom: '1px solid #1A1A1A' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1A1A1A')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {COLS.map(({ key }) => (
              <td
                key={key}
                className="px-3 py-2 text-[12px] font-mono"
                style={{
                  color:
                    key === 'ticker'
                      ? '#FF9900'
                      : key === 'unrealized_pnl'
                      ? h[key] >= 0
                        ? '#00C805'
                        : '#FF3B30'
                      : '#FFFFFF',
                }}
              >
                {formatCell(key, h[key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
git commit -m "feat: HoldingsTable terminal style, remove Framer Motion"
```

---

### Task 9: Chat components — terminal style

**Files:**
- Modify: `frontend/src/components/Chat/ChatInput.jsx`
- Modify: `frontend/src/components/Chat/MessageBubble.jsx`
- Modify: `frontend/src/components/Chat/AgentIndicator.jsx`
- Modify: `frontend/src/components/Chat/SuggestedPrompts.jsx`
- Modify: `frontend/src/components/Chat/ChatWindow.jsx`

#### ChatInput.jsx

**Step 1: Replace `frontend/src/components/Chat/ChatInput.jsx` entirely**

```jsx
import { Square, ArrowUp } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder }) {
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) onStop?.()
      else onSubmit?.()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] shrink-0 font-mono" style={{ color: '#FF9900' }}>{'>'}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled && !isGenerating}
        placeholder={placeholder ?? 'Enter command...'}
        autoFocus
        className="flex-1 bg-transparent outline-none text-[13px] font-mono"
        style={{ color: '#FFFFFF' }}
      />
      {isGenerating ? (
        <button
          onClick={onStop}
          className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-mono transition-colors"
          style={{ border: '1px solid #FF3B30', color: '#FF3B30', background: 'transparent' }}
          title="Stop"
        >
          <Square size={10} className="fill-current" />
          STOP
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-mono transition-colors disabled:opacity-30"
          style={{ border: '1px solid #FF9900', color: '#FF9900', background: 'transparent' }}
          title="Send"
        >
          <ArrowUp size={10} />
          SEND
        </button>
      )}
    </div>
  )
}
```

#### MessageBubble.jsx

**Step 2: Replace `frontend/src/components/Chat/MessageBubble.jsx` entirely**

```jsx
import { cloneElement } from 'react'
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
    if (match[2]) parts.push(<strong key={idx++} style={{ color: '#FFFFFF', fontWeight: 700 }}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++} style={{ color: '#FF9900' }}>{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code key={idx++} className="font-mono text-[12px] px-1" style={{ color: '#FF9900', background: '#1A1A1A' }}>
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
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(
        <div key={k++} className="my-2" style={{ border: '1px solid #1E1E1E' }}>
          {lang && (
            <div className="px-3 py-1 text-[10px] uppercase tracking-wide font-mono"
              style={{ background: '#1A1A1A', color: '#FF9900', borderBottom: '1px solid #1E1E1E' }}>
              {lang}
            </div>
          )}
          <pre className="font-mono text-[12px] p-3 overflow-x-auto whitespace-pre"
            style={{ background: '#0D0D0D', color: '#FFFFFF' }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++; continue
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={k++} className="font-bold text-sm mt-2.5 mb-1 font-mono" style={{ color: '#FF9900' }}>{parseInline(line.slice(4))}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={k++} className="font-bold text-base mt-3 mb-1.5 font-mono" style={{ color: '#FF9900' }}>{parseInline(line.slice(3))}</h2>)
      i++; continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2)); i++
      }
      elements.push(
        <ul key={k++} className="ml-2 my-1 space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-[13px] font-mono" style={{ color: '#CCCCCC' }}>
              <span style={{ color: '#FF9900' }}>- </span>{parseInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, '')); i++
      }
      elements.push(
        <ol key={k++} className="ml-2 my-1 space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-[13px] font-mono" style={{ color: '#CCCCCC' }}>
              <span style={{ color: '#FF9900' }}>{idx + 1}. </span>{parseInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-2" style={{ borderColor: '#1E1E1E' }} />)
      i++; continue
    }
    if (line.trim() === '') { elements.push(<div key={k++} className="h-1.5" />); i++; continue }

    elements.push(
      <p key={k++} className="my-0.5 leading-6 text-[13px] font-mono" style={{ color: '#CCCCCC' }}>
        {parseInline(line)}
      </p>
    )
    i++
  }
  return elements
}

const cursor = (
  <span className="inline-block ml-0.5 h-3.5 w-0.5 animate-pulse" style={{ background: '#FF9900' }} />
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
      if (Block) elements.push(<div key={idx} className="my-2"><Block data={seg.data} /></div>)
    }
  })
  return elements
}

export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'
  let rendered = isUser ? null : renderContent(content, streaming)
  if (streaming && rendered) rendered = appendCursor(rendered)

  if (isUser) {
    return (
      <div className="flex justify-end mb-2">
        <div className="text-[13px] font-mono" style={{ color: '#FF9900' }}>
          {'> '}{content}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-3 text-[13px] font-mono" style={{ color: '#FF3B30' }}>
        ERROR: {rendered}
      </div>
    )
  }

  return (
    <div className="mb-3 pl-3" style={{ borderLeft: '2px solid #FF9900' }}>
      {rendered}
    </div>
  )
}
```

#### AgentIndicator.jsx

**Step 3: Replace `frontend/src/components/Chat/AgentIndicator.jsx` entirely**

```jsx
import { useState, useEffect } from 'react'

const AGENT_LABELS = {
  portfolio_analyzer: 'ANALYZING PORTFOLIO',
  market_researcher: 'RESEARCHING MARKETS',
  client_communicator: 'COMPOSING RESPONSE',
  orchestrator: 'ROUTING QUERY',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ').toUpperCase() ?? 'PROCESSING'
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-1 text-[11px] font-mono" style={{ color: '#FF9900' }}>
      {label}{dots}
    </div>
  )
}
```

#### SuggestedPrompts.jsx

**Step 4: Replace `frontend/src/components/Chat/SuggestedPrompts.jsx` entirely**

```jsx
const PROMPTS = {
  conservative_retiree: [
    'How is this portfolio performing?',
    'Is their income stream stable?',
    'Should we rebalance now?',
    'What is the current dividend yield?',
  ],
  aggressive_growth: [
    'Tax harvesting opportunities?',
    'Where should we add risk?',
    'Show the tech exposure',
    'Best performing positions?',
  ],
  young_professional: [
    'Explain the portfolio risk profile',
    'Are they on track for their goals?',
    'What should they invest in next?',
    'What is the Sharpe ratio?',
  ],
  institutional: [
    'Performance attribution this quarter',
    'Factor exposure summary',
    'Show rebalancing trades',
    'Macro risk overview',
  ],
}

export default function SuggestedPrompts({ persona, onSelect, dynamicSuggestions }) {
  const prompts =
    dynamicSuggestions && dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : PROMPTS[persona] ?? []

  if (!prompts.length) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 shrink-0">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect?.(prompt)}
          className="text-[11px] px-2 py-1 font-mono transition-colors"
          style={{ border: '1px solid #1E1E1E', color: '#888888', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FF9900'
            e.currentTarget.style.color = '#FF9900'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1E1E1E'
            e.currentTarget.style.color = '#888888'
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
```

#### ChatWindow.jsx

**Step 5: Make these targeted changes to `frontend/src/components/Chat/ChatWindow.jsx`**

Change 1 — Input area wrapper (find and replace):
```jsx
// FIND:
      <div className="shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.60)' }}>
// REPLACE:
      <div className="shrink-0" style={{ borderTop: '1px solid #1E1E1E', background: '#0D0D0D' }}>
```

Change 2 — Actions popover container (find and replace):
```jsx
// FIND:
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl overflow-hidden z-50 animate-slide-up" style={{ border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
// REPLACE:
                <div className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden z-50 animate-slide-up" style={{ border: '1px solid #FF9900', background: '#111111' }}>
```

Change 3 — Popover header (find and replace):
```jsx
// FIND:
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest font-sans" style={{ color: '#6e6e73' }}>AI Actions</span>
                    <button onClick={() => setActionsOpen(false)} className="transition-colors" style={{ color: '#6e6e73' }}>
// REPLACE:
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E1E1E' }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#FF9900' }}>AI ACTIONS</span>
                    <button onClick={() => setActionsOpen(false)} className="font-mono text-[11px] transition-colors" style={{ color: '#888888' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF9900')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}>
```

Change 4 — Action item hover row (find and replace):
```jsx
// FIND:
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-black/[0.04] transition-colors group"
// REPLACE:
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1A1A1A')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
```

Change 5 — Action item icon container (find and replace):
```jsx
// FIND:
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                          style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--persona-primary)' }}>
// REPLACE:
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center"
                          style={{ background: '#1A1A1A', border: '1px solid #1E1E1E', color: '#FF9900' }}>
```

Change 6 — Action item text (find and replace):
```jsx
// FIND:
                          <p className="text-sm font-medium font-sans" style={{ color: '#1c1c1e' }}>{label}</p>
                          <p className="text-[11px] leading-tight font-sans" style={{ color: '#6e6e73' }}>{desc}</p>
// REPLACE:
                          <p className="text-[12px] font-mono" style={{ color: '#FFFFFF' }}>{label}</p>
                          <p className="text-[10px] font-mono leading-tight" style={{ color: '#888888' }}>{desc}</p>
```

Change 7 — Actions button (find and replace the className/style block):
```jsx
// FIND:
                className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all font-sans ${isGenerating ? 'cursor-not-allowed opacity-30' : ''}`}
                style={actionsOpen
                  ? { border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.80)', color: '#1c1c1e' }
                  : { border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.60)', color: '#6e6e73' }}
// REPLACE:
                className={`flex h-10 items-center gap-1.5 px-3 text-[11px] font-mono transition-all ${isGenerating ? 'cursor-not-allowed opacity-30' : ''}`}
                style={actionsOpen
                  ? { border: '1px solid #FF9900', background: 'transparent', color: '#FF9900' }
                  : { border: '1px solid #1E1E1E', background: 'transparent', color: '#888888' }}
```

Change 8 — Empty state icon (find and replace):
```jsx
// FIND:
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
// REPLACE:
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center"
            style={{ background: '#1A1A1A', border: '1px solid #1E1E1E' }}
```

Change 9 — Empty state heading (find and replace):
```jsx
// FIND:
          <h3 className="mb-1.5 font-display text-lg font-semibold" style={{ color: '#1c1c1e' }}>
// REPLACE:
          <h3 className="mb-1.5 font-mono text-base font-bold" style={{ color: '#FF9900' }}>
```

Change 10 — Empty state paragraph (find and replace):
```jsx
// FIND:
          <p className="mb-6 max-w-sm text-sm leading-relaxed font-sans" style={{ color: '#6e6e73' }}>
// REPLACE:
          <p className="mb-6 max-w-sm text-[12px] leading-relaxed font-mono" style={{ color: '#888888' }}>
```

Change 11 — Reconnecting text (find and replace):
```jsx
// FIND:
            <span className="text-[11px] font-sans" style={{ color: '#6e6e73' }}>Reconnecting…</span>
// REPLACE:
            <span className="text-[11px] font-mono" style={{ color: '#888888' }}>RECONNECTING...</span>
```

Change 12 — Clear button (find and replace):
```jsx
// FIND:
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors font-sans"
            style={{ color: '#6e6e73' }}
// REPLACE:
            className="flex items-center gap-1 px-2 py-1 text-[11px] transition-colors font-mono"
            style={{ color: '#888888' }}
```

Change 13 — Message area background. Find the messages scroll area div:
```jsx
// FIND:
            <div className="h-full overflow-y-auto">
              <div className="px-5 py-4">
// REPLACE:
            <div className="h-full overflow-y-auto" style={{ background: '#0D0D0D' }}>
              <div className="px-4 py-3">
```

**Step 6: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 7: Commit**

```bash
git add frontend/src/components/Chat/ChatInput.jsx frontend/src/components/Chat/MessageBubble.jsx frontend/src/components/Chat/AgentIndicator.jsx frontend/src/components/Chat/SuggestedPrompts.jsx frontend/src/components/Chat/ChatWindow.jsx
git commit -m "feat: chat components terminal style — amber monospace throughout"
```

---

### Task 10: Cleanup — delete obsolete components

**Files:**
- Delete: `frontend/src/components/Dashboard/HeroCard.jsx`
- Delete: `frontend/src/components/Dashboard/MetricCards.jsx`
- Delete: `frontend/src/components/Dashboard/AllocationChart.jsx`

**Step 1: Verify nothing imports them**

```bash
grep -r "HeroCard\|MetricCards\|AllocationChart" /Users/vikranthreddimasu/Desktop/WealthAgent/frontend/src --include="*.jsx" --include="*.js" -l
```

Expected: no output (or only the files themselves).

**Step 2: Delete the files**

```bash
rm frontend/src/components/Dashboard/HeroCard.jsx
rm frontend/src/components/Dashboard/MetricCards.jsx
rm frontend/src/components/Dashboard/AllocationChart.jsx
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: `✓ built`, no errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove HeroCard, MetricCards, AllocationChart (inlined into terminal layout)"
```

---

### Task 11: Final verification

**Step 1: Full build**

```bash
cd /Users/vikranthreddimasu/Desktop/WealthAgent/frontend && npm run build
```

Expected: `✓ built in ~Xs`, no errors.

**Step 2: Smoke test checklist**

Start dev server: `npm run dev` and open `http://localhost:5173`

- [ ] Background is near-black `#0D0D0D`
- [ ] Top bar: `▸ WEALTHAGENT` in amber, F-key persona tabs
- [ ] Active persona tab: amber text + amber bottom border + subtle amber bg
- [ ] Left sidebar: portfolio value in amber, dot-leader metrics, text allocation bars
- [ ] Performance chart: amber line, dark grid, ~6 X-axis date ticks
- [ ] Sector chart: amber horizontal bars, no rounded ends
- [ ] Holdings table: amber tickers, white numbers, green/red P&L text only (no badge)
- [ ] Console bar at bottom: `●` green dot, `>` amber prompt
- [ ] Click console bar → flat amber-bordered panel slides up instantly (0.15s)
- [ ] Chat panel: dark bg, amber user messages (`> text`), white AI text with amber left border
- [ ] ESC closes chat panel
- [ ] Suggested prompts: flat border buttons, hover turns amber
- [ ] Agent indicator: `ANALYZING PORTFOLIO...` blinking dots in amber

**Step 3: Commit if last-minute fixes were needed**

```bash
git add -A
git commit -m "fix: terminal layout final polish"
```

---

## Summary

| Task | Files | Change |
|---|---|---|
| 1 | index.css | Terminal CSS variables, remove all glass |
| 2 | tailwind.config.js | Monospace font stack |
| 3 | App.jsx | Fixed-viewport terminal layout |
| 4 | ChatBar.jsx | Console bar + 2D flat overlay |
| 5 | PersonaPills.jsx | F-key terminal tab style |
| 6 | PerformanceChart.jsx | Amber line, 6-tick X-axis, no fill |
| 7 | SectorChart.jsx | Amber bars, no radius, dark grid |
| 8 | HoldingsTable.jsx | Terminal colors, no Framer Motion |
| 9 | 5 chat files | Amber monospace terminal style |
| 10 | 3 deleted files | Remove HeroCard, MetricCards, AllocationChart |
| 11 | — | Final build + smoke test |
