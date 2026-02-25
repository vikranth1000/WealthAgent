import { useAnimatedValue } from '../../hooks/useAnimatedValue'

function formatValue(key, value) {
  if (value == null) return '\u2014'
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

function AnimatedCard({ label, rawValue, formatKey }) {
  const animated = useAnimatedValue(rawValue)

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-[15px] font-bold mt-0.5 tabular-nums ${valueColor(formatKey, rawValue)}`}>
        {formatValue(formatKey, rawValue != null ? animated : null)}
      </p>
    </div>
  )
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
      {cards.map(({ key, label }) => (
        <AnimatedCard
          key={key}
          label={label}
          rawValue={metrics[key] ?? null}
          formatKey={key}
        />
      ))}
    </div>
  )
}
