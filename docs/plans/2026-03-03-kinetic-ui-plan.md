# Kinetic UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform WealthAgent into a high-kinetic, Skiper UI × Robinhood × Cash App financial interface with Framer Motion spring physics, @number-flow rolling digit counters, CSS conic-gradient magic borders, and persona-reactive accent system.

**Architecture:** Install three new libs (framer-motion, @number-flow/react, sonner), add CSS magic-border utilities, then update components from the bottom up — leaf components first, containers last. No new components created; every change is a targeted enhancement to existing files.

**Tech Stack:** React 18 + Vite + Tailwind CSS + Framer Motion v11 + @number-flow/react + Sonner + Recharts

---

### Task 1: Install dependencies

**Files:**
- Modify: `frontend/package.json` (via npm install)

**Step 1: Install the three new packages**

```bash
cd frontend && npm install framer-motion @number-flow/react sonner
```

**Step 2: Verify build still passes**

```bash
npm run build
```

Expected: `✓ built in ~Xs` with no errors.

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install framer-motion, @number-flow/react, sonner"
```

---

### Task 2: CSS Foundation — deeper backgrounds + magic border

**Files:**
- Modify: `frontend/src/index.css`

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
  initial-value: #3B82F6;
}

@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

/* ─── Global base ─── */

html, body {
  background: #05080F;
}

:root {
  --persona-primary: #3B82F6;
  transition: --persona-primary 1.2s ease;
}

/* ─── Magic border (Skiper UI conic-gradient sweep) ─── */

@keyframes spin-angle {
  to { --angle: 360deg; }
}

/* Wrapper: use `padding: 1px` to reveal the gradient beneath the inner card */
.magic-card {
  position: relative;
  padding: 1px;
  border-radius: 12px;
}

/* The spinning gradient — hidden by default, shown on hover or .magic-card--active */
.magic-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
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
  opacity: 1;
}

/* Inner card: sits above the gradient */
.magic-card-inner {
  position: relative;
  z-index: 1;
  border-radius: 11px;
  background: #090D1C;
}

/* ─── Persona-reactive utilities ─── */

@layer utilities {
  .glass-dark {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .glass-darker {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(0, 0, 0, 0.20);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .persona-border {
    border: 1px solid color-mix(in srgb, var(--persona-primary) 30%, transparent);
  }

  .persona-border-glow {
    border: 1px solid color-mix(in srgb, var(--persona-primary) 50%, transparent);
    box-shadow: 0 0 12px color-mix(in srgb, var(--persona-primary) 35%, transparent),
                inset 0 0 8px color-mix(in srgb, var(--persona-primary) 8%, transparent);
  }

  .persona-bg-subtle {
    background: color-mix(in srgb, var(--persona-primary) 10%, transparent);
  }

  .persona-bg-medium {
    background: color-mix(in srgb, var(--persona-primary) 18%, transparent);
  }

  .persona-text {
    color: var(--persona-primary);
  }

  .persona-divider {
    background: color-mix(in srgb, var(--persona-primary) 55%, transparent);
    box-shadow:
      4px 0 20px color-mix(in srgb, var(--persona-primary) 30%, transparent),
      -4px 0 20px color-mix(in srgb, var(--persona-primary) 30%, transparent);
  }

  .shimmer-dark {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
    background-size: 200% 100%;
  }
}

/* ─── Dark scrollbar ─── */

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.10) transparent;
}

*::-webkit-scrollbar { width: 4px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.10);
  border-radius: 9999px;
}
*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.20);
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add magic-card CSS, deeper bg, @property --angle"
```

---

### Task 3: App.jsx — Framer Motion panel wrappers + animated orbs + Toaster

**Files:**
- Modify: `frontend/src/App.jsx`

**Context:** App.jsx renders the full-screen duality layout: left chat panel (55%), plasma divider (1px), right portfolio panel (45%). Three floating background orbs provide ambient persona color. We're adding Framer Motion entrance animations on panels and orbs, converting orbs to `motion.div` so they animate their color, and dropping in the `<Toaster>` for sonner.

**Step 1: Replace `frontend/src/App.jsx` with**

```jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import RightPanel from './components/Layout/RightPanel.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const PERSONA_COLORS = {
  conservative_retiree: '#3B82F6',
  aggressive_growth: '#F59E0B',
  young_professional: '#A855F7',
  institutional: '#2DD4BF',
}

const spring = { type: 'spring', stiffness: 260, damping: 28 }

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)
  const [isGenerating, setIsGenerating] = useState(false)

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
    const color = PERSONA_COLORS[selectedClient?.persona] ?? '#3B82F6'
    document.documentElement.style.setProperty('--persona-primary', color)
  }, [selectedClient?.persona])

  const accentColor = PERSONA_COLORS[selectedClient?.persona] ?? '#3B82F6'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#05080F] font-sans">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full blur-3xl"
          animate={{ backgroundColor: accentColor, opacity: 0.04 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 -translate-y-1/2 h-80 w-80 rounded-full blur-3xl"
          animate={{ backgroundColor: accentColor, opacity: 0.03 }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.div
          className="absolute -bottom-40 right-16 h-72 w-72 rounded-full blur-3xl"
          animate={{ backgroundColor: accentColor, opacity: 0.04 }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
        />
      </div>

      {/* Left panel — Chat */}
      <motion.div
        className="relative z-10 flex w-[55%] flex-col h-full bg-[#05080F]/90"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={spring}
      >
        <PersonaPills
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
        />
        <div className="flex-1 min-h-0">
          {selectedClient ? (
            <ChatWindow
              client={selectedClient}
              portfolioData={portfolioData}
              onGeneratingChange={setIsGenerating}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600 text-sm">
              {clientsLoading ? 'Loading clients…' : 'Select a client to begin'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Glowing divider */}
      <motion.div
        className="relative z-10 w-px shrink-0"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        style={{ originY: 0 }}
      >
        <div
          className={`absolute inset-0 persona-divider transition-all duration-[1200ms] ${isGenerating ? 'animate-breathe' : ''}`}
        />
      </motion.div>

      {/* Right panel — Portfolio */}
      <motion.div
        className="relative z-10 flex w-[45%] flex-col h-full"
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...spring, delay: 0.15 }}
      >
        <RightPanel client={selectedClient} portfolioData={portfolioData} />
      </motion.div>

      <Toaster position="bottom-left" theme="dark" />
    </div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: Framer Motion panel entrances, animated orbs, Toaster, persona violet upgrade"
```

---

### Task 4: PersonaPills — layoutId sliding active indicator

**Files:**
- Modify: `frontend/src/components/Chat/PersonaPills.jsx`

**Context:** The active pill indicator becomes a `motion.div` with `layoutId="active-pill"` that physically slides underneath the active button as you switch clients — like iOS tab bars. No CSS class toggle jank.

**Step 1: Replace `frontend/src/components/Chat/PersonaPills.jsx` with**

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
    <div className="flex items-center gap-3 px-5 py-3 shrink-0 border-b border-white/[0.06]">
      {/* Wordmark */}
      <div className="flex items-center gap-2 shrink-0 mr-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.08]">
          <Sparkles size={13} className="text-slate-400" />
        </div>
        <span className="font-display text-sm font-semibold text-slate-400 tracking-tight">
          WealthAgent
        </span>
      </div>

      <div className="h-4 w-px bg-white/[0.08] shrink-0" />

      {/* Client pills */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-white/[0.05] animate-pulse shrink-0" />
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
                className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 whitespace-nowrap font-sans z-0"
                style={{ color: isActive ? 'var(--persona-primary)' : undefined }}
              >
                {/* Sliding background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'color-mix(in srgb, var(--persona-primary) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--persona-primary) 35%, transparent)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  size={11}
                  className={isActive ? '' : 'text-slate-500 opacity-60'}
                />
                <span className={isActive ? '' : 'text-slate-500 opacity-70'}>
                  {firstName}
                </span>
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

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/PersonaPills.jsx
git commit -m "feat: PersonaPills layoutId sliding indicator"
```

---

### Task 5: AgentIndicator — Framer Motion dots + glow ring

**Files:**
- Modify: `frontend/src/components/Chat/AgentIndicator.jsx`

**Context:** Replace CSS `animate-bounce` with Framer Motion `y` keyframe animation for precise control, and add a pulsing glow ring behind the dots.

**Step 1: Replace `frontend/src/components/Chat/AgentIndicator.jsx` with**

```jsx
import { motion } from 'framer-motion'

const AGENT_LABELS = {
  portfolio_analyzer: 'Analyzing portfolio',
  market_researcher: 'Researching markets',
  client_communicator: 'Composing response',
  orchestrator: 'Routing query',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ') ?? 'Thinking'

  return (
    <motion.div
      className="flex items-center gap-2.5 py-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="relative flex items-center gap-1">
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full blur-sm"
          style={{ background: 'var(--persona-primary)' }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="relative h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--persona-primary)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 font-sans">{label}…</span>
    </motion.div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/AgentIndicator.jsx
git commit -m "feat: AgentIndicator Framer Motion dots + glow ring"
```

---

### Task 6: SuggestedPrompts — staggered motion entrance + hover

**Files:**
- Modify: `frontend/src/components/Chat/SuggestedPrompts.jsx`

**Context:** Each chip staggers in with scale + fade using Framer Motion variants. Hover scales up slightly. The container re-triggers the stagger when prompts change (key on the container).

**Step 1: Replace `frontend/src/components/Chat/SuggestedPrompts.jsx` with**

```jsx
import { motion } from 'framer-motion'

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const chip = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26 } },
}

export default function SuggestedPrompts({ persona, onSelect, compact, dynamicSuggestions }) {
  const prompts = (dynamicSuggestions && dynamicSuggestions.length > 0)
    ? dynamicSuggestions
    : (PROMPTS[persona] ?? [])

  if (!prompts.length) return null

  const isDynamic = dynamicSuggestions && dynamicSuggestions.length > 0

  return (
    <motion.div
      key={prompts.join(',')}
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-wrap gap-1.5 px-5 py-2.5 shrink-0"
    >
      {prompts.map((prompt) => (
        <motion.button
          key={prompt}
          variants={chip}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect?.(prompt)}
          className="rounded-full border border-white/[0.10] bg-transparent px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300 hover:border-white/[0.22] hover:bg-white/[0.04] font-sans whitespace-nowrap"
          style={isDynamic ? { borderColor: 'color-mix(in srgb, var(--persona-primary) 25%, rgba(255,255,255,0.10))' } : {}}
        >
          {prompt}
        </motion.button>
      ))}
    </motion.div>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/SuggestedPrompts.jsx
git commit -m "feat: SuggestedPrompts staggered motion entrance"
```

---

### Task 7: ChatInput — magic border on focus + send button glow

**Files:**
- Modify: `frontend/src/components/Chat/ChatInput.jsx`

**Context:** Wrap the input in a `.magic-card` div so the conic-gradient border activates on focus. The send button gets a glow shadow and `whileTap` spring. Remove the old inline `boxShadow` focus style (the magic card replaces it).

**Step 1: Replace `frontend/src/components/Chat/ChatInput.jsx` with**

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
      {/* Magic border wrapper activates on focus */}
      <div className={`flex-1 magic-card ${focused ? 'magic-card--active' : ''}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled && !isGenerating}
          placeholder={placeholder ?? 'Ask WealthAgent\u2026'}
          className="magic-card-inner w-full h-11 px-4 text-sm text-slate-200 placeholder-slate-600 outline-none font-sans bg-transparent"
        />
      </div>

      {isGenerating ? (
        <motion.button
          onClick={onStop}
          whileTap={{ scale: 0.92 }}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border border-rose-500/40 bg-rose-500/[0.10] text-rose-400 hover:bg-rose-500/[0.16] transition-all"
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
            boxShadow: value?.trim() ? '0 0 18px color-mix(in srgb, var(--persona-primary) 50%, transparent)' : 'none',
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

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/ChatInput.jsx
git commit -m "feat: ChatInput magic border on focus, send button glow"
```

---

### Task 8: MessageBubble — Framer Motion spring entrance + left border draw

**Files:**
- Modify: `frontend/src/components/Chat/MessageBubble.jsx`

**Context:** Wrap each bubble in a `motion.div` for spring entrance. The AI bubble's left accent border becomes a `motion.div` that scales from 0 to 1 on Y axis (draws top-to-bottom). The component itself doesn't manage AnimatePresence — that lives in ChatWindow (Task 9).

**Step 1: Replace the export default function + assistant bubble JSX in `frontend/src/components/Chat/MessageBubble.jsx`**

Replace the entire file with:

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
    if (match[2]) parts.push(<strong key={idx++} className="text-slate-200 font-semibold">{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++} className="text-slate-400 italic">{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code key={idx++} className="bg-white/[0.08] text-slate-300 font-mono text-[13px] px-1.5 py-0.5 rounded">
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
        <div key={k++} className="my-2 overflow-hidden rounded-lg border border-white/[0.08]">
          {lang && (
            <div className="bg-white/[0.06] px-3 py-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide border-b border-white/[0.08]">
              {lang}
            </div>
          )}
          <pre className="bg-black/40 text-slate-300 border border-white/[0.08] font-mono text-[13px] rounded-lg p-3 overflow-x-auto whitespace-pre">
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={k++} className="text-slate-300 font-display font-semibold text-sm mt-2.5 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={k++} className="text-slate-200 font-display font-bold text-base mt-3 mb-1.5">
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
            <li key={idx} className="text-slate-400 leading-relaxed">{parseInline(item)}</li>
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
            <li key={idx} className="text-slate-400 leading-relaxed">{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-3 border-white/[0.08]" />)
      i++
      continue
    }

    if (line.trim() === '') {
      elements.push(<div key={k++} className="h-2" />)
      i++
      continue
    }

    elements.push(<p key={k++} className="my-0.5 leading-6 text-slate-300">{parseInline(line)}</p>)
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
          className="max-w-[68%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-slate-100 font-sans leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--persona-primary) 14%, rgba(255,255,255,0.04))',
            border: '1px solid color-mix(in srgb, var(--persona-primary) 28%, rgba(255,255,255,0.06))',
          }}
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
        <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-rose-400 font-sans border border-rose-500/20 bg-rose-500/[0.06]">
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
        {/* Animated left accent border — draws top-to-bottom */}
        <motion.div
          className="w-[3px] rounded-full shrink-0 mr-3 self-stretch"
          style={{ background: 'color-mix(in srgb, var(--persona-primary) 55%, transparent)' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
          style2={{ originY: 0 }}
        />
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-300 font-sans leading-relaxed shadow-glass"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {rendered}
        </div>
      </div>
    </motion.div>
  )
}
```

**Note:** There's a duplicate `style` prop on the left border `motion.div` above — fix it to use a single `style` object combining both:

```jsx
<motion.div
  className="w-[3px] rounded-full shrink-0 mr-3 self-stretch"
  style={{
    background: 'color-mix(in srgb, var(--persona-primary) 55%, transparent)',
    originY: 0,
  }}
  initial={{ scaleY: 0 }}
  animate={{ scaleY: 1 }}
  transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
/>
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/MessageBubble.jsx
git commit -m "feat: MessageBubble Framer Motion spring entrance, animated border draw"
```

---

### Task 9: ChatWindow — AnimatePresence messages + sonner toast

**Files:**
- Modify: `frontend/src/components/Chat/ChatWindow.jsx`

**Context:** Wrap the messages list in `AnimatePresence` so MessageBubble exit animations play. Replace the custom undo toast state/JSX with a single `toast()` call from sonner.

**Step 1: Update imports at top of `frontend/src/components/Chat/ChatWindow.jsx`**

Change line 1:
```jsx
import { useState, useRef, useEffect, useCallback } from 'react'
```
to:
```jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
```

**Step 2: Remove the undo state and timer**

Remove these lines:
```jsx
const [undoRestore, setUndoRestore] = useState(null)
const undoTimerRef = useRef(null)
```

**Step 3: Replace `handleClearChat`**

Replace:
```jsx
const handleClearChat = useCallback(async () => {
  const restoreFn = await clearChat()
  if (!restoreFn) return
  setUndoRestore(() => restoreFn)
  clearTimeout(undoTimerRef.current)
  undoTimerRef.current = setTimeout(() => setUndoRestore(null), 5000)
}, [clearChat])
```

With:
```jsx
const handleClearChat = useCallback(async () => {
  const restoreFn = await clearChat()
  if (!restoreFn) return
  toast('Chat cleared', {
    action: { label: 'Undo', onClick: restoreFn },
  })
}, [clearChat])
```

**Step 4: Remove `handleUndo` callback and the undo toast JSX block**

Remove:
```jsx
const handleUndo = useCallback(() => {
  undoRestore?.()
  setUndoRestore(null)
  clearTimeout(undoTimerRef.current)
}, [undoRestore])
```

And remove this JSX block:
```jsx
{undoRestore && (
  <div className="flex items-center justify-between px-5 py-2 bg-white/[0.06] border-y border-white/[0.08] text-xs shrink-0 animate-slide-up">
    <span className="text-slate-400 font-sans">Chat cleared</span>
    <button
      onClick={handleUndo}
      className="flex items-center gap-1 rounded-md px-2 py-1 bg-white/[0.10] hover:bg-white/[0.15] text-slate-300 transition-colors font-sans"
    >
      <Undo2 size={11} />
      Undo
    </button>
  </div>
)}
```

Also remove `Undo2` from the lucide import at the top.

**Step 5: Wrap the messages map in AnimatePresence**

Find:
```jsx
{messages.map((msg, i) => (
  <MessageBubble
    key={i}
    role={msg.role}
    content={msg.content}
    streaming={msg.streaming}
    error={msg.error}
  />
))}
```

Replace with:
```jsx
<AnimatePresence initial={false}>
  {messages.map((msg, i) => (
    <MessageBubble
      key={i}
      role={msg.role}
      content={msg.content}
      streaming={msg.streaming}
      error={msg.error}
    />
  ))}
</AnimatePresence>
```

**Step 6: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 7: Commit**

```bash
git add frontend/src/components/Chat/ChatWindow.jsx
git commit -m "feat: ChatWindow AnimatePresence messages, sonner toast"
```

---

### Task 10: RightPanel — NumberFlow hero portfolio value

**Files:**
- Modify: `frontend/src/components/Layout/RightPanel.jsx`

**Context:** Replace the static `$X,XXX,XXX` span with `@number-flow/react`'s `NumberFlow` component. Digits roll to new values on every client switch. Add drop-shadow glow filter.

**Step 1: Add import at top of `frontend/src/components/Layout/RightPanel.jsx`**

```jsx
import NumberFlow from '@number-flow/react'
```

**Step 2: Replace the hero value paragraph**

Find:
```jsx
<p
  className="font-mono text-3xl font-semibold mt-3 transition-all duration-700"
  style={{ color: 'var(--persona-primary)' }}
>
  $
  {analysis.total_value?.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}
</p>
```

Replace with:
```jsx
<NumberFlow
  value={analysis.total_value ?? 0}
  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
  className="font-mono font-semibold mt-3 block"
  style={{
    fontSize: '2.25rem',
    lineHeight: 1,
    color: 'var(--persona-primary)',
    filter: 'drop-shadow(0 0 20px color-mix(in srgb, var(--persona-primary) 40%, transparent))',
  }}
/>
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 4: Commit**

```bash
git add frontend/src/components/Layout/RightPanel.jsx
git commit -m "feat: RightPanel NumberFlow rolling hero portfolio value"
```

---

### Task 11: MetricCards — magic border hover + NumberFlow values + motion stagger

**Files:**
- Modify: `frontend/src/components/Dashboard/MetricCards.jsx`

**Context:** Each card gets the `.magic-card` wrapper so the conic-gradient border sweeps on hover. Values switch to `NumberFlow` for rolling animation on client switch. Cards stagger in with Framer Motion.

**Step 1: Replace `frontend/src/components/Dashboard/MetricCards.jsx` with**

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
    color: (v) => (v >= 0 ? '#34D399' : '#F87171'),
  },
  {
    key: 'sharpe',
    label: 'Sharpe Ratio',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    color: () => '#94A3B8',
  },
  {
    key: 'maxDrawdown',
    label: 'Max Drawdown',
    format: { style: 'percent', maximumFractionDigits: 1 },
    color: () => '#F87171',
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
            <div className="magic-card-inner px-3 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 font-sans mb-2">
                {label}
              </p>
              {value != null ? (
                <NumberFlow
                  value={value}
                  format={format}
                  className="font-mono text-[22px] font-semibold leading-none"
                  style={{ color: color(value) }}
                />
              ) : (
                <span className="font-mono text-[22px] font-semibold text-slate-700">—</span>
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

Expected: no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/Dashboard/MetricCards.jsx
git commit -m "feat: MetricCards magic border hover, NumberFlow values, motion stagger"
```

---

### Task 12: HoldingsTable — motion rows with AnimatePresence on sort

**Files:**
- Modify: `frontend/src/components/Dashboard/HoldingsTable.jsx`

**Context:** Wrap tbody rows in `AnimatePresence mode="popLayout"` with `motion.tr layout` so rows physically reorder with spring animation when the user clicks a sort column.

**Step 1: Add imports to `frontend/src/components/Dashboard/HoldingsTable.jsx`**

Add at top:
```jsx
import { motion, AnimatePresence } from 'framer-motion'
```

**Step 2: Replace the `<tbody>` block**

Find:
```jsx
<tbody>
  {sorted.map((h, i) => (
    <tr key={h.ticker || i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
      {COLS.map(({ key }) => (
        <td
          key={key}
          className={
            key === 'ticker'
              ? 'px-2 py-2.5 font-mono font-semibold text-slate-300 text-xs'
              : 'px-2 py-2.5 font-mono text-xs text-slate-500'
          }
        >
          {key === 'unrealized_pnl' ? (
            <span className={
              h[key] >= 0
                ? 'rounded-full px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10'
                : 'rounded-full px-1.5 py-0.5 font-mono text-[10px] text-rose-400 bg-rose-500/10'
            }>
              {formatCell(key, h[key])}
            </span>
          ) : key === 'ticker' ? h.ticker : formatCell(key, h[key])}
        </td>
      ))}
    </tr>
  ))}
</tbody>
```

Replace with:
```jsx
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
        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
      >
        {COLS.map(({ key }) => (
          <td
            key={key}
            className={
              key === 'ticker'
                ? 'px-2 py-2.5 font-mono font-semibold text-slate-300 text-xs'
                : 'px-2 py-2.5 font-mono text-xs text-slate-500'
            }
          >
            {key === 'unrealized_pnl' ? (
              <span className={
                h[key] >= 0
                  ? 'rounded-full px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10'
                  : 'rounded-full px-1.5 py-0.5 font-mono text-[10px] text-rose-400 bg-rose-500/10'
              }>
                {formatCell(key, h[key])}
              </span>
            ) : key === 'ticker' ? h.ticker : formatCell(key, h[key])}
          </td>
        ))}
      </motion.tr>
    ))}
  </AnimatePresence>
</tbody>
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 4: Commit**

```bash
git add frontend/src/components/Dashboard/HoldingsTable.jsx
git commit -m "feat: HoldingsTable AnimatePresence sort animation"
```

---

### Task 13: Charts — enable Recharts animations + AllocationChart color upgrade

**Files:**
- Modify: `frontend/src/components/Dashboard/AllocationChart.jsx`
- Modify: `frontend/src/components/Dashboard/PerformanceChart.jsx`
- Modify: `frontend/src/components/Dashboard/SectorChart.jsx`

**Context:** All three charts currently have `isAnimationActive={false}` or no animation config. Enable Recharts native animation and upgrade AllocationChart's color palette to richer dark tones.

**Step 1: Update AllocationChart.jsx — upgrade palette + enable animation**

In `frontend/src/components/Dashboard/AllocationChart.jsx`, replace:
```jsx
const COLORS = ['#1B2A4A', '#0D9488', '#F59E0B', '#7C3AED', '#3B82F6', '#EF4444']
```
With:
```jsx
const COLORS = ['#3B82F6', '#0D9488', '#F59E0B', '#A855F7', '#F43F5E', '#06B6D4']
```

Then on the `<Pie>` component, change `isAnimationActive={false}` to:
```jsx
isAnimationActive={true}
animationBegin={0}
animationDuration={700}
animationEasing="ease-out"
```

**Step 2: Update PerformanceChart.jsx — enable animation on Area**

In `frontend/src/components/Dashboard/PerformanceChart.jsx`, on the `<Area>` component add:
```jsx
isAnimationActive={true}
animationBegin={0}
animationDuration={800}
animationEasing="ease-out"
```

**Step 3: Update SectorChart.jsx — enable animation on Bar**

In `frontend/src/components/Dashboard/SectorChart.jsx`, on the `<Bar>` component, change `isAnimationActive={false}` to:
```jsx
isAnimationActive={true}
animationBegin={0}
animationDuration={700}
animationEasing="ease-out"
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 5: Commit**

```bash
git add frontend/src/components/Dashboard/AllocationChart.jsx frontend/src/components/Dashboard/PerformanceChart.jsx frontend/src/components/Dashboard/SectorChart.jsx
git commit -m "feat: enable Recharts animations, upgrade AllocationChart palette"
```

---

## Verification Checklist

After all 13 tasks are complete, run:

```bash
cd frontend && npm run build
```

Expected output: `✓ built` with no errors or warnings about missing modules.

Then run `npm run dev` and visually verify:

- [ ] Page load: panels slide in from sides, divider draws down
- [ ] Persona pills: clicking a client makes the indicator slide (not snap) to new pill
- [ ] Client switch: portfolio value digits roll to new value
- [ ] Metric cards: hover activates rotating gradient border sweep
- [ ] Chat input: focus activates magic border sweep on the input wrapper
- [ ] Send button: glows in persona color when input has text
- [ ] Agent indicator: three dots bounce with Framer Motion, glow ring pulses
- [ ] Suggested prompts: chips stagger in, scale on hover
- [ ] Message bubbles: spring entrance, left border draws top-to-bottom
- [ ] Holdings table: clicking sort header makes rows spring-animate to new positions
- [ ] Switching client: all persona colors transition smoothly (orbs, divider, charts)
- [ ] `sonner` toast appears bottom-left when clearing chat, with Undo action
