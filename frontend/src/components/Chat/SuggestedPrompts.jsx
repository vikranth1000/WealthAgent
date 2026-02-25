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

// Props: persona (string), onSelect (fn), compact (bool), dynamicSuggestions (string[])
export default function SuggestedPrompts({ persona, onSelect, compact, dynamicSuggestions }) {
  // Use dynamic suggestions if available, otherwise fall back to static persona prompts
  const prompts = (dynamicSuggestions && dynamicSuggestions.length > 0)
    ? dynamicSuggestions
    : (PROMPTS[persona] ?? [])

  if (!prompts.length) return null

  const isDynamic = dynamicSuggestions && dynamicSuggestions.length > 0

  return (
    <div className={`flex flex-wrap gap-2 px-4 ${compact ? 'pt-2 pb-1.5' : 'py-3'}`}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect?.(prompt)}
          className={`rounded-lg border transition-all active:scale-95 shadow-sm ${
            isDynamic
              ? 'border-teal/30 bg-teal/5 text-teal hover:border-teal/50 hover:bg-teal/10 hover:shadow-md'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
          } ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'}`}
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
