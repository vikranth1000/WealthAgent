const DISCLAIMER =
  '\u26a0\ufe0f AI-generated. Not financial advice. Consult a qualified advisor before making investment decisions.'

// Props: role ('user' | 'assistant'), content (string), agent (string | null)
export default function MessageBubble({ role, content, agent }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[80%]">
        {!isUser && agent && (
          <p className="text-xs text-gray-400 mb-1 ml-1">via {agent}</p>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-navy text-white rounded-br-sm'
              : 'bg-light-gray text-gray-800 border border-gray-200 rounded-bl-sm'
          }`}
        >
          {content}
        </div>
        {!isUser && (
          <p className="text-xs text-gray-400 mt-1 ml-1 leading-snug">{DISCLAIMER}</p>
        )}
      </div>
    </div>
  )
}
