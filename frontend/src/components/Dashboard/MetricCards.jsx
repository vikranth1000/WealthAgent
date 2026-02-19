// Metric cards: total value, YTD return, Sharpe, max drawdown
// Props: metrics { totalValue, ytdReturn, sharpe, maxDrawdown }
export default function MetricCards({ metrics = {} }) {
  const cards = [
    { label: 'Total Value', value: metrics.totalValue ?? '—' },
    { label: 'YTD Return', value: metrics.ytdReturn ?? '—' },
    { label: 'Sharpe Ratio', value: metrics.sharpe ?? '—' },
    { label: 'Max Drawdown', value: metrics.maxDrawdown ?? '—' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map(({ label, value }) => (
        <div key={label} className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-base font-bold text-navy mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  )
}
