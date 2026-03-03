import { motion } from 'framer-motion'

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const chip = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26 } },
}

export default function SuggestedPrompts({ persona, onSelect, compact, dynamicSuggestions }) {
  const prompts = (dynamicSuggestions && dynamicSuggestions.length > 0)
    ? dynamicSuggestions
    : (PROMPTS[persona] ?? [])

  if (!prompts.length) return null

  const isDynamic = dynamicSuggestions && dynamicSuggestions.length > 0

  return (
    <motion.div
      key={prompts.join(',')}
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-wrap gap-1.5 px-5 py-2.5 shrink-0"
    >
      {prompts.map((prompt) => (
        <motion.button
          key={prompt}
          variants={chip}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect?.(prompt)}
          className="rounded-full border border-white/[0.10] bg-transparent px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300 hover:border-white/[0.22] hover:bg-white/[0.04] font-sans whitespace-nowrap"
          style={isDynamic ? { borderColor: 'color-mix(in srgb, var(--persona-primary) 25%, rgba(255,255,255,0.10))' } : {}}
        >
          {prompt}
        </motion.button>
      ))}
    </motion.div>
  )
}
