// Props: metrics { totalValue, ytdReturn, sharpe, maxDrawdown }
// totalValue: number → "$1,218,400"
// ytdReturn: fraction (0.018) → "+1.8%" green / red
// sharpe: number → "0.82"
// maxDrawdown: fraction (-0.038) → "-3.8%"

function formatValue(key, value) {
  if (value == null) return '—'
  switch (key) {
    case 'totalValue':
      return `$${Math.round(value).toLocaleString()}`
    case 'ytdReturn': {
      const pct = (value * 100).toFixed(1)
      return `${value >= 0 ? '+' : ''}${pct}%`
    }
    case 'sharpe':
      return value.toFixed(2)
    case 'maxDrawdown':
      return `${(value * 100).toFixed(1)}%`
    default:
      return String(value)
  }
}

function valueColor(key, value) {
  if (key === 'ytdReturn') return value >= 0 ? 'text-green-600' : 'text-red-500'
  if (key === 'maxDrawdown') return 'text-red-500'
  return 'text-navy'
}

export default function MetricCards({ metrics = {} }) {
  const cards = [
    { key: 'totalValue', label: 'Total Value' },
    { key: 'ytdReturn', label: 'YTD Return' },
    { key: 'sharpe', label: 'Sharpe Ratio' },
    { key: 'maxDrawdown', label: 'Max Drawdown' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map(({ key, label }) => {
        const raw = metrics[key] ?? null
        return (
          <div key={key} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className={`text-[15px] font-bold mt-0.5 ${valueColor(key, raw)}`}>
              {formatValue(key, raw)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
