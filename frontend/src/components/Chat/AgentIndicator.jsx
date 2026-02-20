const AGENT_PIPELINE = ['portfolio_analyzer', 'market_research', 'comms']

const AGENT_LABELS = {
  portfolio_analyzer: 'Analyzing Portfolio',
  market_research: 'Researching Markets',
  comms: 'Writing Response',
  orchestrator: 'Routing',
}

// Shows a pulsing indicator with step progress while an agent is processing
// Props: agent (string | null)
export default function AgentIndicator({ agent }) {
  if (!agent) return null

  const stepIndex = AGENT_PIPELINE.indexOf(agent)
  const step = stepIndex >= 0 ? stepIndex + 1 : null
  const total = AGENT_PIPELINE.length

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/[0.08] px-3 py-1.5 text-xs font-medium text-teal">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
      </span>
      <span>{AGENT_LABELS[agent] ?? agent}</span>
      {step && (
        <span className="tabular-nums text-teal/60">{step}/{total}</span>
      )}
    </div>
  )
}
