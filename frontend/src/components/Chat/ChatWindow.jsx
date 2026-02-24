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

export default function ChatWindow({ client, portfolioData }) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Connection status + clear chat */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/70 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-400'}`}
          />
          <span className="text-xs font-medium text-gray-500">
            {isConnected ? 'Connected' : 'Reconnecting\u2026'}
          </span>
        </div>
        {messages.length > 0 && !isGenerating && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Clear chat history"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Undo toast */}
      {undoRestore && (
        <div className="flex items-center justify-between px-4 py-2 bg-navy text-white text-xs shrink-0">
          <span>Chat cleared</span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 rounded-md px-2 py-1 bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Undo2 size={12} />
            Undo
          </button>
        </div>
      )}

      {messages.length === 0 && !activeAction ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10">
            <MessageSquare size={22} className="text-teal" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-navy">Chat with WealthAgent</h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-500">
            Ask anything about {client?.name ?? 'your client'}&apos;s portfolio, performance, or
            market conditions.
          </p>
          <SuggestedPrompts persona={client?.persona} onSelect={handleSend} />
        </div>
      ) : (
        /* Chat area */
        <div className="flex-1 relative min-h-0">
          <div className="h-full overflow-y-auto">
            <div className="px-4 py-3">
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
      <div className="border-t border-gray-200 bg-white shrink-0">
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
                className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all ${
                  actionsOpen
                    ? 'border-teal/40 bg-teal/10 text-teal'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700'
                } ${isGenerating ? 'cursor-not-allowed opacity-40' : ''}`}
                title="AI Actions"
              >
                <Zap size={14} />
                Actions
              </button>

              {/* Popover menu */}
              {actionsOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Actions</span>
                    <button onClick={() => setActionsOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="py-1">
                    {ACTIONS.map(({ id, label, desc, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleAction(id)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/8 text-teal group-hover:bg-teal/15 transition-colors">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-[11px] text-gray-400 leading-tight">{desc}</p>
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
