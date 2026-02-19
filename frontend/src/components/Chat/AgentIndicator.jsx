const AGENT_LABELS = {
  portfolio_analyzer: 'Portfolio Analyzer',
  market_research: 'Market Researcher',
  comms: 'Client Communicator',
  orchestrator: 'Orchestrator',
}

// Shows a pulsing indicator while an agent is processing
// Props: agent (string | null)
export default function AgentIndicator({ agent }) {
  if (!agent) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 text-teal text-xs font-medium w-fit">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
      </span>
      {AGENT_LABELS[agent] ?? agent} is thinking…
    </div>
  )
}
