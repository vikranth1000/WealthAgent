import { BarChart3, X, Sparkles } from 'lucide-react'

const SCENARIOS = [
  {
    name: '2008 Financial Crisis',
    description: 'Severe equity drawdown, flight to safety',
    multipliers: { 'US Equity': -0.50, 'Int\'l Equity': -0.55, 'Bonds': 0.05, 'Real Estate': -0.35, 'Cash': 0.0 },
  },
  {
    name: 'Rate Shock (+300bps)',
    description: 'Sharp interest rate rise',
    multipliers: { 'US Equity': -0.15, 'Int\'l Equity': -0.20, 'Bonds': -0.12, 'Real Estate': -0.20, 'Cash': 0.02 },
  },
  {
    name: 'Stagflation',
    description: 'High inflation + stagnant growth',
    multipliers: { 'US Equity': -0.25, 'Int\'l Equity': -0.30, 'Bonds': -0.08, 'Real Estate': -0.10, 'Cash': -0.03 },
  },
  {
    name: 'Tech Crash',
    description: 'Technology sector correction (-40%)',
    multipliers: { 'US Equity': -0.30, 'Int\'l Equity': -0.15, 'Bonds': 0.03, 'Real Estate': -0.05, 'Cash': 0.0 },
  },
]

function computeImpact(allocation, multipliers) {
  if (!allocation) return 0
  let impact = 0
  for (const [cls, weight] of Object.entries(allocation)) {
    const mult = multipliers[cls] ?? multipliers['US Equity'] ?? -0.20
    impact += weight * mult
  }
  return impact
}

function ImpactBar({ value }) {
  const pct = Math.abs(value * 100)
  const maxWidth = Math.min(pct, 60)
  const isNeg = value < 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3.5 bg-gray-100 rounded-full relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            isNeg ? 'bg-red-400' : 'bg-green-400'
          }`}
          style={{ width: `${maxWidth}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-14 text-right ${
        isNeg ? 'text-red-600' : 'text-green-600'
      }`}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  )
}

export default function StressTestCard({ allocation, totalValue, onClose, onAskAI }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-navy" />
          <h3 className="text-sm font-semibold text-navy">Stress Test Scenarios</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
        >
          <X size={13} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        {SCENARIOS.map((scenario) => {
          const impact = computeImpact(allocation, scenario.multipliers)
          const dollarImpact = (totalValue || 0) * impact

          return (
            <div key={scenario.name} className="rounded-xl border border-gray-200 p-3 hover:border-gray-300 transition-colors">
              <div className="mb-1.5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{scenario.name}</p>
                  <p className="text-xs text-gray-400">{scenario.description}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ml-2 ${
                  dollarImpact < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {dollarImpact < 0 ? '-' : '+'}${Math.abs(dollarImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <ImpactBar value={impact} />
            </div>
          )
        })}

        <button
          onClick={() => onAskAI?.('Run a stress test analysis on this client\'s portfolio. Which scenarios pose the greatest risk? What hedging strategies or allocation changes would improve resilience?')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <Sparkles size={13} />
          Get AI Risk Analysis
        </button>

        <p className="text-xs text-gray-400 italic mt-2">
          Scenarios use historical-based multipliers applied to current allocation. For illustration only.
        </p>
      </div>
    </div>
  )
}
