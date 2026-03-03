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
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.05] shadow-glass backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <Scissors size={15} className="text-slate-200" />
          <h3 className="text-sm font-semibold text-slate-200">Tax-Loss Harvesting</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-slate-300"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary callout */}
        <div className="flex gap-3">
          <div className="flex-1 bg-red-500/10 rounded-xl px-3 py-2.5 border border-red-500/20">
            <p className="text-[10px] font-medium text-red-400 uppercase tracking-wide">Harvestable Loss</p>
            <p className="text-base font-bold text-red-400 mt-0.5">
              {formatCurrency(total_harvestable_loss, { absolute: true })}
            </p>
          </div>
          <div className="flex-1 bg-green-500/10 rounded-xl px-3 py-2.5 border border-green-500/20">
            <p className="text-[10px] font-medium text-green-400 uppercase tracking-wide">Est. Tax Savings</p>
            <p className="text-base font-bold text-green-400 mt-0.5">
              {formatCurrency(estimated_tax_savings)}
            </p>
          </div>
        </div>

        {/* Candidates table */}
        {candidates && candidates.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Candidates
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Ticker</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Shares</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Cost Basis</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Current</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Return</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => {
                    const returnPct = formatFixed(c.unrealized_return_pct, 1)
                    return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}>
                      <td className="px-3 py-2 font-semibold text-slate-200">{c.ticker}</td>
                      <td className="px-3 py-2 text-right text-slate-400">
                        {formatFixed(c.shares, 1)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400">
                        {formatCurrency(c.cost_basis_per_share, { decimals: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400">
                        {formatCurrency(c.current_price, { decimals: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-400">
                        {returnPct === '-' ? '-' : `${returnPct}%`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-400">
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
          <div className="text-center py-4 text-sm text-slate-500">
            No tax-loss harvesting candidates found. All positions are above the -5% threshold.
          </div>
        )}

        <button
          onClick={() => onAskAI?.('Analyze this client\'s tax-loss harvesting opportunities. Which positions should be harvested first? Are there any wash sale risks? Suggest replacement securities to maintain similar exposure.')}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--persona-primary, #0D9488)' }}
        >
          <Sparkles size={13} />
          Get AI Tax Strategy
        </button>

        <p className="text-xs text-slate-600 italic">
          Tax savings estimated at 25% marginal rate. Consult a tax advisor for exact figures.
        </p>
      </div>
    </div>
  )
}
