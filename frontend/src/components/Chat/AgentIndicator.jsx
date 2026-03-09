import { useState, useEffect } from 'react'

const AGENT_LABELS = {
  portfolio_analyzer: 'Analyzing Portfolio',
  market_researcher: 'Researching Markets',
  client_communicator: 'Composing Response',
  orchestrator: 'Routing Query',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ') ?? 'Processing'
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-1 text-xs font-medium text-white/60 tracking-wider flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
      {label}{dots}
    </div>
  )
}

