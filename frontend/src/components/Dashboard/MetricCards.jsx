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

function valueStyle(key, value) {
  if (key === 'totalValue') return { color: 'var(--persona-primary)' }
  if (key === 'ytdReturn') return { color: value >= 0 ? '#34D399' : '#F87171' }
  if (key === 'sharpe') return { color: '#94A3B8' }
  if (key === 'maxDrawdown') return { color: '#F87171' }
  return {}
}

function AnimatedCard({ label, rawValue, formatKey }) {
  const animated = useAnimatedValue(rawValue)

  return (
    <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 font-sans mb-1.5">{label}</p>
      <p
        className="font-mono text-base font-semibold transition-all duration-700"
        style={valueStyle(formatKey, rawValue)}
      >
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
