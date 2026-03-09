import { ArrowRightLeft, TrendingUp, TrendingDown, X, Sparkles } from 'lucide-react'

function AllocationBar({ label, current, target }) {
  const currentPct = (current * 100).toFixed(1)
  const targetPct = (target * 100).toFixed(1)
  const drift = Math.abs(current - target) * 100

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-slate-400 truncate">{label}</span>
      <div className="flex-1 bg-white/[0.05] rounded-full h-2.5 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(current * 100, 100)}%`, backgroundColor: 'var(--persona-primary, #0D9488)', opacity: 0.6 }}
        />
        <div
          className="absolute inset-y-0 left-0 border-r-2 border-slate-200 h-full"
          style={{ width: `${Math.min(target * 100, 100)}%` }}
        />
      </div>
      <span className="w-20 text-right text-slate-500">
        {currentPct}% → {targetPct}%
      </span>
      {drift >= 1 && (
        <span className="text-orange-500 font-medium w-12 text-right">
          {drift.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

export default function RebalancingCard({ data, onClose, onAskAI }) {
  if (!data) return null

  const { current_allocation, target_allocation, drift, trades, total_buy_value, total_sell_value } = data
  const allClasses = [...new Set([
    ...Object.keys(current_allocation || {}),
    ...Object.keys(target_allocation || {}),
  ])]

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.05] shadow-glass backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={15} className="text-slate-200" />
          <h3 className="text-sm font-semibold text-slate-200">Portfolio Rebalancing</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-slate-300"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Allocation comparison */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Current vs Target Allocation
          </p>
          <div className="space-y-2">
            {allClasses.map((cls) => (
              <AllocationBar
                key={cls}
                label={cls}
                current={current_allocation?.[cls] || 0}
                target={target_allocation?.[cls] || 0}
              />
            ))}
          </div>
        </div>

        {/* Trades table */}
        {trades && trades.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Suggested Trades
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Action</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Ticker</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Class</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Shares</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          t.action === 'BUY' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {t.action === 'BUY' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {t.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-200">{t.ticker}</td>
                      <td className="px-3 py-2 text-slate-500">{t.asset_class}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{t.shares.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-300">
                        ${t.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4 mt-2 text-xs">
              <span className="text-green-400 font-medium">
                Total Buy: ${total_buy_value?.toLocaleString() ?? '0'}
              </span>
              <span className="text-red-400 font-medium">
                Total Sell: ${total_sell_value?.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>
        )}

        {(!trades || trades.length === 0) && (
          <div className="text-center py-4 text-sm text-slate-500">
            Portfolio is within target allocation. No trades needed.
          </div>
        )}

        <button
          onClick={() => onAskAI?.('Analyze this client\'s rebalancing needs. Review the current vs target allocation drift and suggest which trades to prioritize first, considering tax implications and transaction costs.')}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--persona-primary, #0D9488)' }}
        >
          <Sparkles size={13} />
          Get AI Rebalancing Analysis
        </button>
      </div>
    </div>
  )
}
