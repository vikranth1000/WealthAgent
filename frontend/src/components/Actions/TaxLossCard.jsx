import { Scissors, X, Sparkles } from 'lucide-react'

function toNumber(value) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatCurrency(value, { absolute = false, decimals = 0 } = {}) {
  const numeric = toNumber(value)
  if (numeric === null) return '-'
  const normalized = absolute ? Math.abs(numeric) : numeric
  return `$${normalized.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function formatFixed(value, decimals = 1) {
  const numeric = toNumber(value)
  if (numeric === null) return '-'
  return numeric.toFixed(decimals)
}

export default function TaxLossCard({ data, onClose, onAskAI }) {
  if (!data || typeof data !== 'object') return null

  const { candidates, total_harvestable_loss, estimated_tax_savings } = data

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Scissors size={15} className="text-navy" />
          <h3 className="text-sm font-semibold text-navy">Tax-Loss Harvesting</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary callout */}
        <div className="flex gap-3">
          <div className="flex-1 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
            <p className="text-xs text-red-400">Harvestable Loss</p>
            <p className="text-base font-bold text-red-600">
              {formatCurrency(total_harvestable_loss, { absolute: true })}
            </p>
          </div>
          <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 border border-green-100">
            <p className="text-xs text-green-500">Est. Tax Savings</p>
            <p className="text-base font-bold text-green-600">
              {formatCurrency(estimated_tax_savings)}
            </p>
          </div>
        </div>

        {/* Candidates table */}
        {candidates && candidates.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Candidates
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Ticker</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Shares</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Cost Basis</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Current</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Return</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => {
                    const returnPct = formatFixed(c.unrealized_return_pct, 1)
                    return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 font-semibold text-navy">{c.ticker}</td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {formatFixed(c.shares, 1)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {formatCurrency(c.cost_basis_per_share, { decimals: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {formatCurrency(c.current_price, { decimals: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-500">
                        {returnPct === '-' ? '-' : `${returnPct}%`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">
                        {formatCurrency(c.unrealized_loss, { absolute: true })}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-400">
            No tax-loss harvesting candidates found. All positions are above the -5% threshold.
          </div>
        )}

        <button
          onClick={() => onAskAI?.('Analyze this client\'s tax-loss harvesting opportunities. Which positions should be harvested first? Are there any wash sale risks? Suggest replacement securities to maintain similar exposure.')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <Sparkles size={13} />
          Get AI Tax Strategy
        </button>

        <p className="text-xs text-gray-400 italic">
          Tax savings estimated at 25% marginal rate. Consult a tax advisor for exact figures.
        </p>
      </div>
    </div>
  )
}
