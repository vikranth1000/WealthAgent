import { MessageSquare } from 'lucide-react'

const PERSONA_PROMPTS = {
  conservative_retiree: [
    'How is my portfolio doing?',
    'Is my income safe?',
    'Should I rebalance now?',
  ],
  aggressive_growth: [
    'Tax harvesting opportunities?',
    'Where should I add risk?',
    'Show me my tech exposure',
  ],
  young_professional: [
    'Explain my portfolio risk',
    'Am I on track for my goals?',
    'What should I invest next?',
  ],
  institutional: [
    'Performance attribution this quarter',
    'Factor exposure summary',
    'Show rebalancing trades',
  ],
}

export default function ChatWindow({ client }) {
  const prompts = PERSONA_PROMPTS[client?.persona] ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mb-4">
          <MessageSquare size={24} className="text-teal" />
        </div>
        <h3 className="text-lg font-semibold text-navy mb-1">
          Chat with WealthAgent
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          Ask anything about {client?.name ?? 'your client'}&apos;s portfolio, performance, or market conditions.
        </p>

        {prompts.length > 0 && (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
              Suggested prompts
            </p>
            {prompts.map((prompt) => (
              <button
                key={prompt}
                className="text-left px-4 py-2.5 rounded-lg border border-gray-200 bg-light-gray hover:border-teal hover:bg-teal/5 text-sm text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-3 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Ask about ${client?.name ?? 'your client'}…`}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal bg-light-gray"
            readOnly
          />
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-teal text-white text-sm font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          WebSocket streaming · Phase 3
        </p>
      </div>
    </div>
  )
}
