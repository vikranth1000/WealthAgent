const PROMPTS = {
  conservative_retiree: [
    'How is my portfolio doing?',
    'Is my income safe?',
    'Should I rebalance now?',
    'What is my dividend yield?',
  ],
  aggressive_growth: [
    'Tax harvesting opportunities?',
    'Where should I add risk?',
    'Show me my tech exposure',
    'Best performing positions?',
  ],
  young_professional: [
    'Explain my portfolio risk',
    'Am I on track for my goals?',
    'What should I invest next?',
    'What is my Sharpe ratio?',
  ],
  institutional: [
    'Performance attribution this quarter',
    'Factor exposure summary',
    'Show rebalancing trades',
    'Macro risk overview',
  ],
}

// Props: persona (string), onSelect (fn)
export default function SuggestedPrompts({ persona, onSelect }) {
  const prompts = PROMPTS[persona] ?? []
  if (!prompts.length) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect?.(prompt)}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-teal hover:bg-teal/5 text-xs text-gray-600 transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
