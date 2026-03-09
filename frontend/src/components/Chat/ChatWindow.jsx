import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Trash2, Zap, ArrowRightLeft, Scissors, BarChart3, FileText, X } from 'lucide-react'
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Slim status + clear row */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'
            }`}
          />
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
            {isConnected ? 'System Online' : 'Reconnecting...'}
          </span>
        </div>
        {messages.length > 0 && !isGenerating && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted hover:text-white transition-colors"
          >
            <Trash2 size={12} />
            Clear Chat
          </button>
        )}
      </div>

      {messages.length === 0 && !activeAction ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-panel border gap-2 border-border shadow-subtle group">
            <MessageSquare size={26} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-white">
            How can I help you today?
          </h3>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted">
            Ask about {client?.name ?? 'your client'}&apos;s portfolio execution, risk exposure, or run complex institutional analysis.
          </p>
          <div className="w-full">
            <SuggestedPrompts persona={client?.persona} onSelect={handleSend} />
          </div>
        </div>
      ) : (
        /* Chat area */
        <div className="flex-1 relative min-h-0 bg-transparent">
          <div className="h-full overflow-y-auto px-6 pt-4 pb-28">
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
              <div className="mb-4 flex justify-start pl-12">
                <AgentIndicator agent={activeAgent} />
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
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

      {/* Input area - Floating Pill at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#111111] via-[#111111]/90 to-transparent pointer-events-none">
        
        <div className="mx-auto w-full max-w-4xl relative pointer-events-auto">
          {/* Actions Popover (Triggered from + button in ChatInput) */}
          {actionsOpen && (
            <div className="absolute bottom-[110%] left-6 mb-2 w-64 bg-[#1C1C1E] border border-border rounded-2xl shadow-drawer overflow-hidden z-50 animate-slide-up origin-bottom-left">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/5">
                <span className="text-xs font-bold uppercase tracking-widest text-white">AI Actions</span>
                <button onClick={() => setActionsOpen(false)} className="text-muted hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
                <div className="py-2">
                  {ACTIONS.map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => handleAction(id)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-white">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-[11px] font-medium text-muted mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat input form */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => handleSend()}
            onStop={stop}
            disabled={!isConnected || isGenerating}
            isGenerating={isGenerating}
            placeholder={`Ask anything about ${client?.name ?? 'client'}...`}
            onActionClick={() => setActionsOpen((o) => !o)}
          />
        </div>
      </div>
    </div>
  )
}

