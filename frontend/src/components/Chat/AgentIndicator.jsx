import { motion } from 'framer-motion'

const AGENT_LABELS = {
  portfolio_analyzer: 'Analyzing portfolio',
  market_researcher: 'Researching markets',
  client_communicator: 'Composing response',
  orchestrator: 'Routing query',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ') ?? 'Thinking'

  return (
    <motion.div
      className="flex items-center gap-2.5 py-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="relative flex items-center gap-1">
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full blur-sm"
          style={{ background: 'var(--persona-primary)' }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="relative h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--persona-primary)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 font-sans">{label}…</span>
    </motion.div>
  )
}
