const AGENT_LABELS = {
  portfolio_analyzer: 'Analyzing portfolio',
  market_researcher: 'Researching markets',
  client_communicator: 'Composing response',
  orchestrator: 'Routing query',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ') ?? 'Thinking'

  return (
    <div className="flex items-center gap-2.5 py-2 animate-fade-in">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full animate-bounce"
            style={{
              background: 'var(--persona-primary)',
              opacity: 0.7,
              animationDelay: `${i * 150}ms`,
              animationDuration: '800ms',
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 font-sans">{label}…</span>
    </div>
  )
}
