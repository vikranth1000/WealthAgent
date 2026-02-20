import { ArrowRightLeft, TrendingUp, TrendingDown, X, Sparkles } from 'lucide-react'

function AllocationBar({ label, current, target }) {
  const currentPct = (current * 100).toFixed(1)
  const targetPct = (target * 100).toFixed(1)
  const drift = Math.abs(current - target) * 100

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-gray-600 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-teal/60 rounded-full"
          style={{ width: `${Math.min(current * 100, 100)}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 border-r-2 border-navy h-full"
          style={{ width: `${Math.min(target * 100, 100)}%` }}
        />
      </div>
      <span className="w-20 text-right text-gray-500">
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={15} className="text-navy" />
          <h3 className="text-sm font-semibold text-navy">Portfolio Rebalancing</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Allocation comparison */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
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
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Suggested Trades
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Action</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Ticker</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Class</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Shares</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          t.action === 'BUY' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {t.action === 'BUY' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {t.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-navy">{t.ticker}</td>
                      <td className="px-3 py-2 text-gray-500">{t.asset_class}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{t.shares.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">
                        ${t.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4 mt-2 text-xs">
              <span className="text-green-600 font-medium">
                Total Buy: ${total_buy_value?.toLocaleString() ?? '0'}
              </span>
              <span className="text-red-500 font-medium">
                Total Sell: ${total_sell_value?.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>
        )}

        {(!trades || trades.length === 0) && (
          <div className="text-center py-4 text-sm text-gray-400">
            Portfolio is within target allocation. No trades needed.
          </div>
        )}

        <button
          onClick={() => onAskAI?.('Analyze this client\'s rebalancing needs. Review the current vs target allocation drift and suggest which trades to prioritize first, considering tax implications and transaction costs.')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <Sparkles size={13} />
          Get AI Rebalancing Analysis
        </button>
      </div>
    </div>
  )
}
