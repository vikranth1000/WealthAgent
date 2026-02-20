import { useRef } from 'react'

const AGENT_PIPELINE = ['portfolio_analyzer', 'market_research', 'comms']

const THINKING_PHRASES = [
  'Brewing insights',
  'Crunching numbers',
  'Cooking up analysis',
  'Sautéing the data',
  'Simmering thoughts',
  'Distilling findings',
  'Percolating ideas',
  'Marinating on this',
  'Whisking together',
  'Stirring the pot',
  'Toasting the numbers',
  'Seasoning the report',
  'Blending perspectives',
  'Garnishing details',
  'Fermenting insights',
  'Infusing context',
  'Steeping in data',
  'Reducing complexity',
  'Folding in analysis',
  'Caramelizing the facts',
  'Plating the response',
  'Kneading the details',
  'Zesting the metrics',
  'Glazing the summary',
  'Proofing the numbers',
  'Drizzling with context',
  'Tempering expectations',
  'Dicing the data',
  'Roasting the figures',
  'Braising the portfolio',
  'Flambing the forecast',
  'Poaching the insights',
  'Grilling the allocations',
  'Julienning the returns',
  'Basting with research',
  'Whipping up a summary',
  'Rolling out findings',
  'Sifting through markets',
  'Measuring the risk',
  'Tasting the numbers',
  'Mincing the details',
  'Deglazing the analysis',
  'Emulsifying the data',
  'Layering the insights',
  'Pickling the metrics',
  'Blanching the returns',
  'Charring the benchmarks',
  'Smoking the signals',
  'Pressing the yields',
  'Churning the portfolio',
]

function pickRandom(lastUsed) {
  const available = THINKING_PHRASES.filter((p) => p !== lastUsed)
  return available[Math.floor(Math.random() * available.length)]
}

// Shows a pulsing indicator with a random fun phrase while an agent is processing
// Props: agent (string | null)
export default function AgentIndicator({ agent }) {
  const phraseRef = useRef(null)
  const lastAgentRef = useRef(null)

  if (!agent) {
    lastAgentRef.current = null
    phraseRef.current = null
    return null
  }

  // Pick a new phrase only when the agent step changes
  if (agent !== lastAgentRef.current) {
    phraseRef.current = pickRandom(phraseRef.current)
    lastAgentRef.current = agent
  }

  const stepIndex = AGENT_PIPELINE.indexOf(agent)
  const step = stepIndex >= 0 ? stepIndex + 1 : null
  const total = AGENT_PIPELINE.length

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/[0.08] px-3 py-1.5 text-xs font-medium text-teal">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
      </span>
      <span>{phraseRef.current}…</span>
      {step && (
        <span className="tabular-nums text-teal/60">{step}/{total}</span>
      )}
    </div>
  )
}
