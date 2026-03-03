import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Trash2, Undo2, Zap, ArrowRightLeft, Scissors, BarChart3, FileText, X } from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import MessageBubble from './MessageBubble'
import AgentIndicator from './AgentIndicator'
import ChatInput from './ChatInput'
import SuggestedPrompts from './SuggestedPrompts'
import ActionPanel from '../Actions/ActionPanel'

const ACTIONS = [
  { id: 'rebalance', label: 'Rebalance', desc: 'Optimize portfolio allocation', icon: ArrowRightLeft },
  { id: 'tax-loss', label: 'Tax Harvest', desc: 'Identify tax-saving opportunities', icon: Scissors },
  { id: 'stress-test', label: 'Stress Test', desc: 'Simulate market scenarios', icon: BarChart3 },
  { id: 'report', label: 'Full Report', desc: 'Comprehensive portfolio review', icon: FileText },
]

export default function ChatWindow({ client, portfolioData, onGeneratingChange }) {
  const { send, stop, messages, activeAgent, isConnected, suggestions, clearChat } = useWebSocket(client?.id)
  const { analysis } = portfolioData
  const [input, setInput] = useState('')
  const [activeAction, setActiveAction] = useState(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [undoRestore, setUndoRestore] = useState(null)
  const undoTimerRef = useRef(null)
  const actionsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeAgent])

  // Reset input and action when client changes
  useEffect(() => {
    setInput('')
    setActiveAction(null)
    setActionsOpen(false)
    setUndoRestore(null)
    clearTimeout(undoTimerRef.current)
  }, [client?.id])

  // Close actions menu on outside click
  useEffect(() => {
    if (!actionsOpen) return
    function handleClick(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setActionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [actionsOpen])

  const handleClearChat = useCallback(async () => {
    const restoreFn = await clearChat()
    if (!restoreFn) return
    setUndoRestore(() => restoreFn)
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoRestore(null), 5000)
  }, [clearChat])

  const handleUndo = useCallback(() => {
    undoRestore?.()
    setUndoRestore(null)
    clearTimeout(undoTimerRef.current)
  }, [undoRestore])

  function handleSend(text) {
    const msg = (text ?? input).trim()
    if (!msg || !isConnected || activeAgent) return
    send(msg, client?.persona)
    setInput('')
  }

  function handleAction(actionId) {
    setActionsOpen(false)
    setActiveAction((prev) => (prev === actionId ? null : actionId))
  }

  const isGenerating = !!activeAgent

  useEffect(() => {
    onGeneratingChange?.(isGenerating)
  }, [isGenerating, onGeneratingChange])

  return (
    <div className="flex flex-col h-full">
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

      {messages.length === 0 && !activeAction ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08]"
            style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--persona-primary) 12%, transparent)' }}
          >
            <MessageSquare size={22} style={{ color: 'var(--persona-primary)', opacity: 0.7 }} />
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
      ) : (
        /* Chat area */
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

          {/* Action panel overlay */}
          <ActionPanel
            action={activeAction}
            clientId={client?.id}
            analysis={analysis}
            onClose={() => setActiveAction(null)}
            onSendMessage={handleSend}
          />
        </div>
      )}

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
        <div className="px-4 py-2.5">
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
                title="AI Actions"
              >
                <Zap size={14} />
                Actions
              </button>

              {/* Popover menu */}
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

            {/* Chat input */}
            <div className="flex-1">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSend()}
                onStop={stop}
                disabled={!isConnected || isGenerating}
                isGenerating={isGenerating}
                placeholder={`Ask about ${client?.name ?? 'your client'}\u2026`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
