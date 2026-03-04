import { useState, useEffect } from 'react'

const AGENT_LABELS = {
  portfolio_analyzer: 'ANALYZING PORTFOLIO',
  market_researcher: 'RESEARCHING MARKETS',
  client_communicator: 'COMPOSING RESPONSE',
  orchestrator: 'ROUTING QUERY',
}

export default function AgentIndicator({ agent }) {
  const label = AGENT_LABELS[agent] ?? agent?.replace(/_/g, ' ').toUpperCase() ?? 'PROCESSING'
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-1 text-[11px] font-mono" style={{ color: '#FF9900' }}>
      {label}{dots}
    </div>
  )
}
