import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Trash2, Zap, ArrowRightLeft, Scissors, BarChart3, FileText, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
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
    toast('Chat cleared', {
      action: { label: 'Undo', onClick: restoreFn },
    })
  }, [clearChat])

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
            <span className="text-[11px] font-mono" style={{ color: '#888888' }}>RECONNECTING...</span>
          )}
        </div>
        {messages.length > 0 && !isGenerating && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2 py-1 text-[11px] transition-colors font-mono"
            style={{ color: '#888888' }}
          >
            <Trash2 size={11} />
            Clear
          </button>
        )}
      </div>

      {messages.length === 0 && !activeAction ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center"
            style={{ background: '#1A1A1A', border: '1px solid #1E1E1E' }}
          >
            <MessageSquare size={22} style={{ color: 'var(--persona-primary)', opacity: 0.7 }} />
          </div>
          <h3 className="mb-1.5 font-mono text-base font-bold" style={{ color: '#FF9900' }}>
            Chat with WealthAgent
          </h3>
          <p className="mb-6 max-w-sm text-[12px] leading-relaxed font-mono" style={{ color: '#888888' }}>
            Ask anything about {client?.name ?? 'your client'}&apos;s portfolio, performance, or
            market conditions.
          </p>
          <SuggestedPrompts persona={client?.persona} onSelect={handleSend} />
        </div>
      ) : (
        /* Chat area */
        <div className="flex-1 relative min-h-0">
          <div className="h-full overflow-y-auto" style={{ background: '#0D0D0D' }}>
            <div className="px-4 py-3">
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
      <div className="shrink-0" style={{ borderTop: '1px solid #1E1E1E', background: '#0D0D0D' }}>
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
                className={`flex h-10 items-center gap-1.5 px-3 text-[11px] font-mono transition-all ${isGenerating ? 'cursor-not-allowed opacity-30' : ''}`}
                style={actionsOpen
                  ? { border: '1px solid #FF9900', background: 'transparent', color: '#FF9900' }
                  : { border: '1px solid #1E1E1E', background: 'transparent', color: '#888888' }}
                title="AI Actions"
              >
                <Zap size={14} />
                Actions
              </button>

              {/* Popover menu */}
              {actionsOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden z-50 animate-slide-up" style={{ border: '1px solid #FF9900', background: '#111111' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E1E1E' }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#FF9900' }}>AI ACTIONS</span>
                    <button onClick={() => setActionsOpen(false)} className="font-mono text-[11px] transition-colors" style={{ color: '#888888' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF9900')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}>
                      <X size={12} />
                    </button>
                  </div>
                  <div className="py-1.5">
                    {ACTIONS.map(({ id, label, desc, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleAction(id)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1A1A1A')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center"
                          style={{ background: '#1A1A1A', border: '1px solid #1E1E1E', color: '#FF9900' }}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-mono" style={{ color: '#FFFFFF' }}>{label}</p>
                          <p className="text-[10px] font-mono leading-tight" style={{ color: '#888888' }}>{desc}</p>
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
