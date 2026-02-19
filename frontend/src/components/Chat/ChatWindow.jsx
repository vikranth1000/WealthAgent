import { useState, useRef, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import MessageBubble from './MessageBubble'
import AgentIndicator from './AgentIndicator'
import ChatInput from './ChatInput'
import SuggestedPrompts from './SuggestedPrompts'

export default function ChatWindow({ client }) {
  const { send, messages, activeAgent, isConnected } = useWebSocket(client?.id)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeAgent])

  // Reset input when client changes
  useEffect(() => {
    setInput('')
  }, [client?.id])

  function handleSend(text) {
    const msg = (text ?? input).trim()
    if (!msg || !isConnected || activeAgent) return
    send(msg, client?.persona)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-gray-100 bg-white shrink-0">
        <span
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`}
        />
        <span className="text-xs text-gray-400">
          {isConnected ? 'Connected' : 'Reconnecting…'}
        </span>
      </div>

      {messages.length === 0 ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">Chat with WealthAgent</h3>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Ask anything about {client?.name ?? 'your client'}&apos;s portfolio, performance, or
            market conditions.
          </p>
          <SuggestedPrompts persona={client?.persona} onSelect={handleSend} />
        </div>
      ) : (
        /* Message list */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              streaming={msg.streaming}
            />
          ))}
          {activeAgent && (
            <div className="flex justify-start mb-2">
              <AgentIndicator agent={activeAgent} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          disabled={!isConnected || !!activeAgent}
          placeholder={`Ask about ${client?.name ?? 'your client'}…`}
        />
      </div>
    </div>
  )
}
