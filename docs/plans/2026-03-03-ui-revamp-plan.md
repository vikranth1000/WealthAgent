# UI Revamp — "Duality" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Revamp WealthAgent's entire frontend into a glassmorphism dark "Duality" layout — two intentional halves (chat left, portfolio right) unified by a persona-colored glowing divider, where switching personas shifts the entire color temperature of the interface.

**Architecture:** CSS custom property `--persona-primary` drives all color throughout via `color-mix()`. Layout is a full-viewport horizontal split: left 55% (chat panel, dark), right 45% (portfolio panel, glass). No header bar, no sidebar rail.

**Tech Stack:** React 18, Vite, Tailwind CSS, Recharts, Lucide React, Google Fonts (Syne, DM Sans, Geist Mono)

---

## Task 1: Foundation — Fonts, Tailwind, CSS Variables

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

**Step 1: Update index.html — replace Inter with Syne + DM Sans + Geist Mono**

Replace the existing Google Fonts `<link>` tag with:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

**Step 2: Rewrite tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A', // keep for any remaining references
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.20)',
        'glass-sm': '0 2px 8px rgba(0,0,0,0.16)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'divider-draw': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        'panel-left': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'panel-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'progress-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'divider-draw': 'divider-draw 0.5s ease-out 0.15s both',
        breathe: 'breathe 2s ease-in-out infinite',
        'panel-left': 'panel-left 0.4s ease-out both',
        'panel-right': 'panel-right 0.4s ease-out 0.35s both',
        'progress-sweep': 'progress-sweep 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

**Step 3: Rewrite frontend/src/index.css**

```css
/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Register persona-primary as an animatable CSS color property */
@property --persona-primary {
  syntax: '<color>';
  inherits: true;
  initial-value: #3B82F6;
}

:root {
  --persona-primary: #3B82F6;
  transition: --persona-primary 1.2s ease;
}

@layer utilities {
  /* Glass surfaces */
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

  /* Persona-reactive utilities — auto-update with --persona-primary */
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
      4px 0 12px color-mix(in srgb, var(--persona-primary) 25%, transparent),
      -4px 0 12px color-mix(in srgb, var(--persona-primary) 25%, transparent);
  }

  .shimmer-dark {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
    background-size: 200% 100%;
  }
}

/* Dark scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.10) transparent;
}

*::-webkit-scrollbar {
  width: 4px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.10);
  border-radius: 9999px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.20);
}
```

**Step 4: Verify — run dev server, confirm no errors**

```bash
cd frontend && npm run dev
```

Expected: Dev server starts, no build errors. App may look broken visually — that's fine, the shell is next.

**Step 5: Commit**

```bash
git add frontend/index.html frontend/tailwind.config.js frontend/src/index.css
git commit -m "feat: Add dark glassmorphism foundation — fonts, CSS vars, Tailwind tokens"
```

---

## Task 2: App Shell — Duality Layout

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Rewrite App.jsx**

Read the current App.jsx first (it's 112 lines). Replace with:

```jsx
import { useState, useEffect, useCallback } from 'react'
import RightPanel from './components/Layout/RightPanel.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const PERSONA_COLORS = {
  conservative_retiree: '#3B82F6',
  aggressive_growth: '#F59E0B',
  young_professional: '#8B5CF6',
  institutional: '#2DD4BF',
}

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

  // Drive the entire color system from the selected persona
  useEffect(() => {
    const color = PERSONA_COLORS[selectedClient?.persona] ?? '#3B82F6'
    document.documentElement.style.setProperty('--persona-primary', color)
  }, [selectedClient?.persona])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A] font-sans">
      {/* Background gradient mesh — reacts to persona color */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full blur-3xl opacity-[0.04] transition-all duration-[2000ms] ease-in-out"
          style={{ background: 'var(--persona-primary)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 -translate-y-1/2 h-80 w-80 rounded-full blur-3xl opacity-[0.03] transition-all duration-[2000ms] ease-in-out delay-300"
          style={{ background: 'var(--persona-primary)' }}
        />
        <div
          className="absolute -bottom-40 right-16 h-72 w-72 rounded-full blur-3xl opacity-[0.04] transition-all duration-[2000ms] ease-in-out delay-700"
          style={{ background: 'var(--persona-primary)' }}
        />
      </div>

      {/* Left panel — Chat */}
      <div className="relative z-10 flex w-[55%] flex-col h-full animate-panel-left bg-[#080D1A]/80">
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
      </div>

      {/* Glowing divider */}
      <div className="relative z-10 w-px shrink-0 animate-divider-draw">
        <div
          className={`absolute inset-0 persona-divider transition-all duration-[1200ms] ${isGenerating ? 'animate-breathe' : ''}`}
        />
      </div>

      {/* Right panel — Portfolio */}
      <div className="relative z-10 flex w-[45%] flex-col h-full animate-panel-right">
        <RightPanel client={selectedClient} portfolioData={portfolioData} />
      </div>
    </div>
  )
}
```

**Step 2: Verify**

```bash
cd frontend && npm run dev
```

Expected: Dark split layout visible. Left panel dark, right panel slightly different dark. Persona pills area empty (PersonaPills doesn't exist yet). Console may show import error for PersonaPills — that's fine, create it next.

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: Implement Duality split layout — no header/sidebar, persona-driven color mesh"
```

---

## Task 3: PersonaPills — Inline Persona Switcher

**Files:**
- Create: `frontend/src/components/Chat/PersonaPills.jsx`

**Step 1: Create the component**

```jsx
import { Shield, TrendingUp, Briefcase, Building2, Sparkles } from 'lucide-react'

const PERSONA_META = {
  conservative_retiree: { label: 'Conservative', icon: Shield },
  aggressive_growth: { label: 'Aggressive', icon: TrendingUp },
  young_professional: { label: 'Young Pro', icon: Briefcase },
  institutional: { label: 'Institutional', icon: Building2 },
}

export default function PersonaPills({ clients, selectedClient, onSelectClient, loading }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 shrink-0 border-b border-white/[0.06]">
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
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-24 rounded-full bg-white/[0.05] animate-pulse shrink-0"
              />
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
                className={`
                  flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
                  transition-all duration-300 whitespace-nowrap font-sans
                  ${isActive
                    ? 'persona-border-glow persona-bg-subtle persona-text'
                    : 'border border-white/[0.10] bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/[0.20] hover:bg-white/[0.04]'
                  }
                `}
              >
                <Icon size={11} className={isActive ? '' : 'opacity-60'} />
                <span className={isActive ? '' : 'opacity-70'}>{firstName}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify**

```bash
cd frontend && npm run dev
```

Expected: Top of left panel shows "WealthAgent" wordmark + 4 client pills. Active pill has a colored glow border. Clicking a pill switches client and the entire background mesh color shifts over ~1.2s.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/PersonaPills.jsx
git commit -m "feat: Add PersonaPills inline persona switcher with glow active state"
```

---

## Task 4: ChatWindow — Dark Layout + Agent Progress

**Files:**
- Modify: `frontend/src/components/Chat/ChatWindow.jsx`

**Step 1: Read the current file first**

Read `frontend/src/components/Chat/ChatWindow.jsx` (242 lines). Key changes needed:
1. Accept `onGeneratingChange` prop and call it when `isGenerating` changes
2. Remove the light status bar + light undo toast — replace with dark versions
3. Restyle the empty state for dark background
4. Restyle the chat area container
5. Restyle the action popover for dark theme
6. Restyle the input area container

**Step 2: Apply changes**

Replace the top of the component (after imports, before return) — add the `onGeneratingChange` prop and effect:

```jsx
export default function ChatWindow({ client, portfolioData, onGeneratingChange }) {
```

After `const isGenerating = !!activeAgent`, add:

```jsx
  useEffect(() => {
    onGeneratingChange?.(isGenerating)
  }, [isGenerating, onGeneratingChange])
```

Replace the status bar div (lines ~84-103):

```jsx
      {/* Slim status + clear row */}
      <div className="flex items-center justify-between px-5 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-400 animate-pulse'
            }`}
          />
          {!isConnected && (
            <span className="text-[11px] text-slate-600 font-sans">Reconnecting…</span>
          )}
        </div>
        {messages.length > 0 && !isGenerating && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-600 hover:text-rose-400 transition-colors font-sans"
          >
            <Trash2 size={11} />
            Clear
          </button>
        )}
      </div>
```

Replace the undo toast (lines ~106-117):

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

Replace the empty state div (lines ~121-131):

```jsx
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08]">
            <MessageSquare size={22} className="text-slate-500" />
          </div>
          <h3 className="mb-1.5 font-display text-lg font-semibold text-slate-300">
            Chat with WealthAgent
          </h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-600 font-sans">
            Ask anything about {client?.name ?? 'your client'}&apos;s portfolio, performance, or
            market conditions.
          </p>
          <SuggestedPrompts persona={client?.persona} onSelect={handleSend} />
        </div>
```

Replace the chat area container (lines ~134-153):

```jsx
        <div className="flex-1 relative min-h-0">
          <div className="h-full overflow-y-auto">
            <div className="px-5 py-4">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  streaming={msg.streaming}
                  error={msg.error}
                />
              ))}
              {activeAgent && (
                <div className="mb-3 flex justify-start">
                  <AgentIndicator agent={activeAgent} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <ActionPanel
            action={activeAction}
            clientId={client?.id}
            analysis={analysis}
            onClose={() => setActiveAction(null)}
            onSendMessage={handleSend}
          />
        </div>
```

Replace the input area container (lines ~167-238) — restyle wrappers, keep all logic:

```jsx
      {/* Input area */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#080D1A]/60">
        {messages.length > 0 && !isGenerating && (
          <SuggestedPrompts
            persona={client?.persona}
            onSelect={handleSend}
            compact
            dynamicSuggestions={suggestions}
          />
        )}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2">
            {/* Actions button + popover */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setActionsOpen((o) => !o)}
                disabled={isGenerating}
                className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all font-sans ${
                  actionsOpen
                    ? 'border-white/20 bg-white/[0.08] text-slate-200'
                    : 'border-white/[0.10] bg-white/[0.04] text-slate-500 hover:border-white/[0.18] hover:text-slate-300'
                } ${isGenerating ? 'cursor-not-allowed opacity-30' : ''}`}
              >
                <Zap size={13} />
                Actions
              </button>

              {actionsOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-white/[0.10] bg-[#0F1929] shadow-2xl overflow-hidden z-50 animate-slide-up">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 font-sans">AI Actions</span>
                    <button onClick={() => setActionsOpen(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="py-1.5">
                    {ACTIONS.map(({ id, label, desc, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleAction(id)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] group-hover:bg-white/[0.10] transition-colors"
                          style={{ color: 'var(--persona-primary)' }}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-300 font-sans">{label}</p>
                          <p className="text-[11px] text-slate-600 leading-tight font-sans">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSend()}
                onStop={stop}
                disabled={!isConnected || isGenerating}
                isGenerating={isGenerating}
                placeholder={`Ask about ${client?.name ?? 'your client'}…`}
              />
            </div>
          </div>
        </div>
      </div>
```

**Step 3: Verify**

```bash
cd frontend && npm run dev
```

Expected: Chat panel has dark background, messages area scrolls, input area at bottom is dark-styled.

**Step 4: Commit**

```bash
git add frontend/src/components/Chat/ChatWindow.jsx
git commit -m "feat: Restyle ChatWindow for dark Duality layout"
```

---

## Task 5: AgentIndicator — Slim Progress Bar

**Files:**
- Modify: `frontend/src/components/Chat/AgentIndicator.jsx`

**Step 1: Read the current file, then replace entirely**

The current AgentIndicator is a floating badge. Replace it with a slim inline indicator that sits inside the chat message flow:

```jsx
const AGENT_LABELS = {
  portfolio_analyzer: 'Analyzing portfolio',
  market_researcher: 'Researching markets',
  client_communicator: 'Composing response',
  orchestrator: 'Routing query',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ') ?? 'Thinking'

  return (
    <div className="flex items-center gap-2.5 py-2 animate-fade-in">
      {/* Animated dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full animate-bounce"
            style={{
              background: 'var(--persona-primary)',
              opacity: 0.7,
              animationDelay: `${i * 150}ms`,
              animationDuration: '800ms',
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 font-sans">{label}…</span>
    </div>
  )
}
```

**Step 2: Verify**

```bash
cd frontend && npm run dev
```

Expected: When AI is processing, three bouncing dots appear in persona color with a label. No more old floating badge.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/AgentIndicator.jsx
git commit -m "feat: Replace AgentIndicator with minimal animated dots"
```

---

## Task 6: MessageBubble — Dark Glass Bubbles

**Files:**
- Modify: `frontend/src/components/Chat/MessageBubble.jsx`

**Step 1: Read the current file**

Read `frontend/src/components/Chat/MessageBubble.jsx`. It handles user/assistant bubbles and markdown rendering including inline blocks. The logic stays — only the visual styles change.

**Step 2: Update user bubble styles**

Find the user message wrapper (right-aligned). Replace its className and add inline style:

Old pattern: `bg-gradient-to-br from-navy to-[#0F1D34]` or similar navy gradient.

New user bubble:
```jsx
// User message outer wrapper — change to:
<div className="flex justify-end mb-3 animate-slide-up">
  <div
    className="max-w-[68%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-slate-100 font-sans leading-relaxed"
    style={{
      background: 'color-mix(in srgb, var(--persona-primary) 14%, rgba(255,255,255,0.04))',
      border: '1px solid color-mix(in srgb, var(--persona-primary) 28%, rgba(255,255,255,0.06))',
    }}
  >
    {content}
  </div>
</div>
```

**Step 3: Update assistant bubble styles**

Old pattern: Light gray background with teal left border.

New assistant bubble:
```jsx
// Assistant message outer wrapper — change to:
<div className="flex justify-start mb-4 animate-slide-up">
  <div
    className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-300 font-sans leading-relaxed shadow-glass"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: '3px solid color-mix(in srgb, var(--persona-primary) 55%, transparent)',
    }}
  >
    {/* markdown content */}
  </div>
</div>
```

**Step 4: Update markdown element styles inside assistant bubbles**

Find all hardcoded Tailwind classes for markdown elements and update to dark theme:

| Element | Old | New |
|---|---|---|
| `h2` | `text-navy font-bold` | `text-slate-200 font-display font-bold` |
| `h3` | `text-navy font-semibold` | `text-slate-300 font-display font-semibold` |
| `code` inline | `bg-gray-100 text-gray-800` | `bg-white/[0.08] text-slate-300 font-mono` |
| `pre`/code block | `bg-gray-900 text-gray-100` | `bg-black/40 text-slate-300 border border-white/[0.08] font-mono` |
| `ul`/`li` | `text-gray-700` | `text-slate-400` |
| `strong` | (default) | `text-slate-200 font-semibold` |

**Step 5: Update error bubble**

Old: Red-tinted light bubble. New:
```jsx
// Error bubble
<div className="flex justify-start mb-3 animate-slide-up">
  <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-rose-400 font-sans border border-rose-500/20 bg-rose-500/[0.06]">
    {content}
  </div>
</div>
```

**Step 6: Update streaming cursor**

Old: teal-colored cursor. New: persona-colored:
```jsx
// Streaming cursor span:
<span
  className="inline-block ml-0.5 h-3.5 w-0.5 rounded-full animate-pulse"
  style={{ background: 'var(--persona-primary)' }}
/>
```

**Step 7: Verify**

```bash
cd frontend && npm run dev
```

Expected: User messages appear as persona-tinted glass pills on the right. Assistant messages appear as dark glass cards with persona-colored left border. No light backgrounds anywhere in chat.

**Step 8: Commit**

```bash
git add frontend/src/components/Chat/MessageBubble.jsx
git commit -m "feat: Restyle message bubbles as dark glass with persona-reactive colors"
```

---

## Task 7: ChatInput + SuggestedPrompts

**Files:**
- Modify: `frontend/src/components/Chat/ChatInput.jsx`
- Modify: `frontend/src/components/Chat/SuggestedPrompts.jsx`

**Step 1: Read both files**

Read `ChatInput.jsx` and `SuggestedPrompts.jsx`.

**Step 2: Restyle ChatInput**

Key changes to the input element and send/stop buttons:

Input element — replace existing className with:
```jsx
className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.10] px-4 text-sm text-slate-200 placeholder-slate-600 outline-none font-sans transition-all"
```
Add focus ring via state (add `useState` for `focused`):
```jsx
const [focused, setFocused] = useState(false)
// On input element:
onFocus={() => setFocused(true)}
onBlur={() => setFocused(false)}
style={focused ? { boxShadow: '0 0 0 2px color-mix(in srgb, var(--persona-primary) 35%, transparent)', borderColor: 'color-mix(in srgb, var(--persona-primary) 40%, transparent)' } : {}}
```

Send button — replace with:
```jsx
<button
  onClick={onSubmit}
  disabled={disabled || !value.trim()}
  className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
  style={{ background: 'var(--persona-primary)' }}
>
  <ArrowUp size={16} className="text-white" />
</button>
```
Import `ArrowUp` from lucide-react (replace whatever send icon was used).

Stop button — replace with:
```jsx
<button
  onClick={onStop}
  className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border border-rose-500/40 bg-rose-500/[0.10] text-rose-400 hover:bg-rose-500/[0.16] transition-all active:scale-95"
>
  <Square size={14} className="fill-current" />
</button>
```
Import `Square` from lucide-react.

**Step 3: Restyle SuggestedPrompts**

Replace prompt button className with:
```jsx
className="rounded-full border border-white/[0.10] bg-transparent px-3 py-1.5 text-xs text-slate-500 transition-all hover:text-slate-300 hover:border-white/[0.22] hover:bg-white/[0.04] font-sans whitespace-nowrap"
```

Replace the container div className with:
```jsx
className="flex flex-wrap gap-1.5 px-5 py-2.5 shrink-0"
```

For dynamic suggestions (compact mode), make them slightly more visible:
```jsx
// Dynamic suggestion buttons get an extra subtle persona tint:
style={{ borderColor: 'color-mix(in srgb, var(--persona-primary) 25%, rgba(255,255,255,0.10))' }}
```

**Step 4: Verify**

```bash
cd frontend && npm run dev
```

Expected: Input is dark glass with persona-color focus ring. Send button uses persona primary color. Suggested prompts are ghost chips that subtly highlight on hover.

**Step 5: Commit**

```bash
git add frontend/src/components/Chat/ChatInput.jsx frontend/src/components/Chat/SuggestedPrompts.jsx
git commit -m "feat: Restyle ChatInput and SuggestedPrompts for dark glass aesthetic"
```

---

## Task 8: RightPanel — Full Restyle

**Files:**
- Modify: `frontend/src/components/Layout/RightPanel.jsx`

**Step 1: Read the current file (123 lines)**

**Step 2: Rewrite RightPanel**

The right panel no longer needs: close button, resize handle, `isOpen`/`onClose`/`width`/`onResizeStart` props — the new layout handles this. Simplify the component signature:

```jsx
import MetricCards from '../Dashboard/MetricCards.jsx'
import AllocationChart from '../Dashboard/AllocationChart.jsx'
import PerformanceChart from '../Dashboard/PerformanceChart.jsx'
import SectorChart from '../Dashboard/SectorChart.jsx'
import HoldingsTable from '../Dashboard/HoldingsTable.jsx'

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 font-sans">
        {title}
      </p>
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white/[0.05] border border-white/[0.06] px-3 py-2.5">
            <div className="h-2.5 w-14 rounded-full bg-white/[0.08] animate-pulse mb-2" />
            <div className="h-5 w-20 rounded-full bg-white/[0.08] animate-pulse" />
          </div>
        ))}
      </div>
      {[32, 40, 32, 48].map((h, i) => (
        <div
          key={i}
          className="rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
          style={{ height: `${h * 4}px` }}
        />
      ))}
    </div>
  )
}

export default function RightPanel({ client, portfolioData }) {
  const { portfolio, analysis, performanceHistory, holdingsDetail, loading, error } = portfolioData

  const metrics = analysis ? {
    totalValue: analysis.total_value,
    ytdReturn: analysis.total_return,
    sharpe: analysis.sharpe_ratio,
    maxDrawdown: analysis.max_drawdown,
  } : {}

  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings

  return (
    <div className="flex flex-col h-full">
      {/* Client header */}
      <div className="px-6 pt-6 pb-5 shrink-0 border-b border-white/[0.06]">
        {client ? (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-2 font-sans">
              Portfolio
            </p>
            <h2 className="font-display text-xl font-semibold text-slate-100 leading-snug">
              {client.name}
            </h2>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-xs text-slate-600 font-sans capitalize">
                {client.persona?.replace(/_/g, ' ')}
              </span>
              {analysis && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium font-mono"
                  style={{
                    color: analysis.total_return >= 0 ? '#34D399' : '#F87171',
                    background: analysis.total_return >= 0
                      ? 'rgba(52,211,153,0.10)'
                      : 'rgba(248,113,113,0.10)',
                  }}
                >
                  {analysis.total_return >= 0 ? '+' : ''}
                  {(analysis.total_return * 100).toFixed(1)}% YTD
                </span>
              )}
            </div>
            {analysis && (
              <p
                className="font-mono text-3xl font-semibold mt-3 transition-all duration-700"
                style={{ color: 'var(--persona-primary)' }}
              >
                $
                {analysis.total_value?.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="h-2.5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-6 w-40 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-8 w-32 rounded-full bg-white/[0.06] animate-pulse mt-3" />
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-rose-400/60 text-sm px-6 text-center font-sans">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div key={client?.id} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <MetricCards metrics={metrics} />
          <Section title="Asset Allocation">
            <AllocationChart data={analysis?.current_allocation} />
          </Section>
          <Section title="Performance">
            <PerformanceChart data={performanceHistory} />
          </Section>
          <Section title="Sector Exposure">
            <SectorChart data={analysis?.sector_breakdown} />
          </Section>
          <Section title="Holdings">
            <HoldingsTable holdings={displayHoldings} enhanced={holdingsDetail.length > 0} />
          </Section>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Verify**

```bash
cd frontend && npm run dev
```

Expected: Right panel shows client name, large portfolio value in persona color, then sections below. No close button, no resize handle.

**Step 4: Commit**

```bash
git add frontend/src/components/Layout/RightPanel.jsx
git commit -m "feat: Restyle RightPanel as duality portfolio half with prominent client header"
```

---

## Task 9: Dashboard Charts — Dark Theme

**Files:**
- Modify: `frontend/src/components/Dashboard/AllocationChart.jsx`
- Modify: `frontend/src/components/Dashboard/PerformanceChart.jsx`
- Modify: `frontend/src/components/Dashboard/SectorChart.jsx`

**Step 1: Read all three files**

**Step 2: AllocationChart.jsx — dark theme**

Key changes:
- Wrap in a transparent container (no white background)
- Legend text: change from dark to `text-slate-500`
- Tooltip: replace any light background with dark glass style via `contentStyle` prop:
  ```jsx
  <Tooltip
    contentStyle={{
      background: 'rgba(8,13,26,0.95)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '12px',
      color: '#CBD5E1',
      fontSize: '12px',
      fontFamily: '"Geist Mono", monospace',
    }}
  />
  ```
- `<Cell>` color array: keep existing palette (navy, teal, amber etc.) but ensure they read well on dark
- Label text: change any dark text fills to `'#94A3B8'`
- Container background class: remove any `bg-white` / `rounded-xl border` wrapper classes

**Step 3: PerformanceChart.jsx — dark theme + persona color**

Key changes:
- `<Area>` stroke: `stroke="var(--persona-primary)"` (was teal hardcode)
- `<Area>` fill: gradient from `var(--persona-primary)` with opacity:
  ```jsx
  <defs>
    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="var(--persona-primary)" stopOpacity={0.18} />
      <stop offset="95%" stopColor="var(--persona-primary)" stopOpacity={0} />
    </linearGradient>
  </defs>
  // fill="url(#perfGradient)"
  ```
- `<CartesianGrid>` strokeDasharray: `stroke="rgba(255,255,255,0.06)"`
- `<XAxis>` / `<YAxis>` tick style: `tick={{ fill: '#475569', fontSize: 11, fontFamily: '"Geist Mono"' }}`
- Tooltip: same dark glass style as AllocationChart
- Container: remove any light background classes

**Step 4: SectorChart.jsx — dark theme + persona color**

Key changes:
- `<Bar>` fill: `fill="var(--persona-primary)"` or a CSS `var()` — note Recharts `fill` takes a string; `"var(--persona-primary)"` works at runtime
- `<CartesianGrid>` stroke: `"rgba(255,255,255,0.06)"`
- Axis ticks: `{ fill: '#475569', fontSize: 11, fontFamily: '"Geist Mono"' }`
- Tooltip: dark glass style
- Remove any light container background

**Step 5: Verify**

```bash
cd frontend && npm run dev
```

Expected: All three charts render on dark background. PerformanceChart and SectorChart use persona color. Charts have subtle grid lines and dark tooltips. Switching persona recolors the charts.

**Step 6: Commit**

```bash
git add frontend/src/components/Dashboard/AllocationChart.jsx frontend/src/components/Dashboard/PerformanceChart.jsx frontend/src/components/Dashboard/SectorChart.jsx
git commit -m "feat: Restyle dashboard charts for dark theme with persona-reactive colors"
```

---

## Task 10: MetricCards + HoldingsTable

**Files:**
- Modify: `frontend/src/components/Dashboard/MetricCards.jsx`
- Modify: `frontend/src/components/Dashboard/HoldingsTable.jsx`

**Step 1: Read both files**

**Step 2: Rewrite MetricCards.jsx**

Replace all card wrapper classes and value color logic. New card structure:
```jsx
// Card wrapper:
className="rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 py-2.5"

// Label:
className="text-[10px] font-bold uppercase tracking-widest text-slate-700 font-sans mb-1.5"

// Value (use font-mono class):
className="font-mono text-base font-semibold transition-all duration-700"
// style:
style={{ color: /* see below */ }}
```

Value color logic:
- `totalValue`: `var(--persona-primary)`
- `ytdReturn`: value >= 0 ? `#34D399` : `#F87171`
- `sharpe`: `#94A3B8`
- `maxDrawdown`: `#F87171`

**Step 3: Restyle HoldingsTable.jsx**

Key class replacements:

```jsx
// Table wrapper: remove any white/gray bg
className="w-full"

// Header row:
className="border-b border-white/[0.08]"

// Header cells:
className="px-2 pb-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-700 font-sans cursor-pointer hover:text-slate-400 transition-colors select-none"

// Sort icon (active): color var(--persona-primary)
// Sort icon (inactive): #475569

// Body rows:
className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"

// Ticker cell:
className="px-2 py-2.5 font-mono font-semibold text-slate-300 text-xs"

// Other cells:
className="px-2 py-2.5 font-mono text-xs text-slate-500"

// P&L cell (positive):
className="rounded-full px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10"

// P&L cell (negative):
className="rounded-full px-1.5 py-0.5 font-mono text-[10px] text-rose-400 bg-rose-500/10"
```

**Step 4: Verify**

```bash
cd frontend && npm run dev
```

Expected: Metric cards use `Geist Mono` for values with color-coded values. Holdings table is dark with monospaced values.

**Step 5: Commit**

```bash
git add frontend/src/components/Dashboard/MetricCards.jsx frontend/src/components/Dashboard/HoldingsTable.jsx
git commit -m "feat: Restyle MetricCards and HoldingsTable for dark glass aesthetic"
```

---

## Task 11: Inline Chat Blocks

**Files:**
- Modify: `frontend/src/components/Chat/blocks/BlockSkeleton.jsx`
- Modify: `frontend/src/components/Chat/blocks/InlineMetrics.jsx`
- Modify: `frontend/src/components/Chat/blocks/InlineTable.jsx`
- Modify: `frontend/src/components/Chat/blocks/InlineCallout.jsx`
- Modify: `frontend/src/components/Chat/blocks/InlineBarChart.jsx` (if it exists)

**Step 1: Read all block files**

**Step 2: BlockSkeleton.jsx**

Replace any light shimmer/loading classes:
```jsx
// Container:
className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 my-2"
// Shimmer lines:
className="h-3 rounded-full bg-white/[0.06] animate-pulse"
// Label text:
className="text-xs text-slate-700 font-sans"
```

**Step 3: InlineMetrics.jsx**

Replace card wrappers:
```jsx
// Outer container: remove white bg
className="grid gap-2 my-3"  // keep grid cols logic

// Each metric card:
className="rounded-xl bg-black/20 border border-white/[0.08] px-3 py-2.5"

// Label:
className="text-[10px] uppercase tracking-wider text-slate-600 font-sans mb-1"

// Value:
className="font-mono text-sm font-semibold text-slate-200"

// Trend icon colors: green-400 / rose-400 / slate-500
```

**Step 4: InlineTable.jsx**

Apply same pattern as HoldingsTable:
```jsx
// Container:
className="my-3 overflow-x-auto rounded-xl border border-white/[0.08]"

// Header cells:
className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 font-sans bg-white/[0.04] border-b border-white/[0.08]"

// Body rows:
className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"

// Cells:
className="px-3 py-2 text-xs text-slate-400 font-mono"

// Positive value:
className="text-emerald-400 font-mono"
// Negative value:
className="text-rose-400 font-mono"
```

**Step 5: InlineCallout.jsx**

Replace the 3 callout variants for dark theme:
```jsx
// info variant:
className="rounded-xl border-l-4 p-3 my-3 bg-blue-500/[0.08] border-l-blue-500/50"
// title: text-blue-400  text: text-blue-300/80  icon: text-blue-400

// warning variant:
className="rounded-xl border-l-4 p-3 my-3 bg-amber-500/[0.08] border-l-amber-500/50"
// title: text-amber-400  text: text-amber-300/80  icon: text-amber-400

// success variant:
className="rounded-xl border-l-4 p-3 my-3 bg-emerald-500/[0.08] border-l-emerald-500/50"
// title: text-emerald-400  text: text-emerald-300/80  icon: text-emerald-400
```

**Step 6: Verify**

```bash
cd frontend && npm run dev
```

Trigger a chat message that contains inline blocks. Expected: blocks appear as dark glass insets inside the assistant bubble.

**Step 7: Commit**

```bash
git add frontend/src/components/Chat/blocks/
git commit -m "feat: Restyle all inline chat blocks for dark glass aesthetic"
```

---

## Task 12: Polish — Final Touches

**Files:**
- Modify: `frontend/src/components/Layout/Header.jsx` (delete or stub — no longer used)
- Modify: `frontend/src/components/Layout/Sidebar.jsx` (delete or stub — no longer used)
- Modify: `frontend/src/index.css` — any remaining light-mode overrides

**Step 1: Remove Header and Sidebar from codebase**

Since App.jsx no longer imports Header or Sidebar, these files are dead code. Delete them:
```bash
rm frontend/src/components/Layout/Header.jsx
rm frontend/src/components/Layout/Sidebar.jsx
```

**Step 2: Audit for remaining light colors**

Search for any remaining `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*` that slipped through:
```bash
grep -r "bg-white\b\|bg-gray-\|text-gray-\|border-gray-" frontend/src/components/ --include="*.jsx" -l
```

For each file found, evaluate whether the class is intentional (e.g., white text on dark button) or a leftover light-mode class to replace.

**Step 3: Polish the empty state in ChatWindow**

When no messages: add a very subtle persona-colored background ring to the icon:
```jsx
<div
  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08]"
  style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--persona-primary) 12%, transparent)' }}
>
  <MessageSquare size={22} style={{ color: 'var(--persona-primary)', opacity: 0.7 }} />
</div>
```

**Step 4: Add `font-display` to Section titles in RightPanel**

In RightPanel's `Section` component, update title style:
```jsx
<p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 font-sans">
```

**Step 5: Final visual pass — run dev, scroll through everything**

```bash
cd frontend && npm run dev
```

Checklist:
- [ ] Persona switch shifts color across entire interface in ~1.2s
- [ ] Background mesh blobs shift color (2s delay, barely visible)
- [ ] Active persona pill has glow, others are muted
- [ ] Left panel is darker than right panel
- [ ] Divider glows in persona color
- [ ] User bubbles: persona-tinted glass
- [ ] Assistant bubbles: dark glass with persona left border
- [ ] Charts use persona color as primary series
- [ ] Portfolio value in right panel uses persona color
- [ ] All text is legible (no light-gray text on light backgrounds)
- [ ] Monospace font (Geist Mono) for all numbers
- [ ] DM Sans for body text
- [ ] Syne for wordmark and headings

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: Complete Duality UI revamp — dark glassmorphism with persona-reactive theming"
```

---

## Summary

12 tasks, each independently verifiable via `npm run dev`. The defining moment — persona color switching — is driven by a single CSS custom property set in App.jsx and cascades via `color-mix()` to every component automatically.

**Execution order is strict** — Task 1 (foundation) must complete before anything else, Task 2 (shell) before Task 3 (PersonaPills), and Tasks 4-12 can be done in order after Task 3.
