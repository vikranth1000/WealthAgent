import { useState, useRef, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { usePortfolio } from '../../hooks/usePortfolio'
import MessageBubble from './MessageBubble'
import AgentIndicator from './AgentIndicator'
import ChatInput from './ChatInput'
import SuggestedPrompts from './SuggestedPrompts'
import ActionToolbar from '../Actions/ActionToolbar'
import ActionPanel from '../Actions/ActionPanel'

export default function ChatWindow({ client }) {
  const { send, stop, messages, activeAgent, isConnected, suggestions } = useWebSocket(client?.id)
  const { analysis } = usePortfolio(client?.id)
  const [input, setInput] = useState('')
  const [activeAction, setActiveAction] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeAgent])

  // Reset input and action when client changes
  useEffect(() => {
    setInput('')
    setActiveAction(null)
  }, [client?.id])

  function handleSend(text) {
    const msg = (text ?? input).trim()
    if (!msg || !isConnected || activeAgent) return
    send(msg, client?.persona)
    setInput('')
  }

  function handleAction(actionId) {
    setActiveAction((prev) => (prev === actionId ? null : actionId))
  }

  const isGenerating = !!activeAgent

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/70 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-400'}`}
        />
        <span className="text-xs font-medium text-gray-500">
          {isConnected ? 'Connected' : 'Reconnecting\u2026'}
        </span>
      </div>

      {/* Analyze Toolbar */}
      <ActionToolbar
        activeAction={activeAction}
        onAction={handleAction}
        disabled={isGenerating}
      />

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
        /* Chat area — relative wrapper for both scrollable messages AND fixed overlay */
        <div className="flex-1 relative min-h-0">
          {/* Scrollable messages */}
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

          {/* Action panel overlay — positioned over the chat, NOT inside the scroll container */}
          <ActionPanel
            action={activeAction}
            clientId={client?.id}
            analysis={analysis}
            onClose={() => setActiveAction(null)}
            onSendMessage={handleSend}
          />
        </div>
      )}

      {/* Persistent suggested prompts + Input bar */}
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
  )
}
