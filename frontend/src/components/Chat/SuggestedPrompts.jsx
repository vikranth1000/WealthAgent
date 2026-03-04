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

export default function SuggestedPrompts({ persona, onSelect, dynamicSuggestions }) {
  const prompts =
    dynamicSuggestions && dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : PROMPTS[persona] ?? []

  if (!prompts.length) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 shrink-0">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect?.(prompt)}
          className="text-[11px] px-2 py-1 font-mono"
          style={{ border: '1px solid #1E1E1E', color: '#888888', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FF9900'
            e.currentTarget.style.color = '#FF9900'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1E1E1E'
            e.currentTarget.style.color = '#888888'
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
