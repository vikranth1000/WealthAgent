import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'

const BASE_COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'asset_class', label: 'Class' },
]

const ENHANCED_COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'current_price', label: 'Price' },
  { key: 'day_change_pct', label: '1D %' },
  { key: 'market_value', label: 'Value' },
  { key: 'unrealized_pnl', label: 'P&L' },
  { key: 'pe_ratio', label: 'P/E' },
]

function formatCell(key, value) {
  if (value == null) return '—'
  if (key === 'shares') return typeof value === 'number' ? value.toFixed(1) : value
  if (key === 'current_price') return `$${value.toFixed(2)}`
  if (key === 'market_value') return `$${Math.round(value).toLocaleString()}`
  if (key === 'unrealized_pnl') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}$${Math.round(value).toLocaleString()}`
  }
  if (key === 'day_change_pct') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}${value.toFixed(2)}%`
  }
  if (key === 'pe_ratio' || key === 'dividend_yield') return value.toFixed(2)
  return String(value)
}

export default function HoldingsTable({ holdings = [], enhanced = false }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  const COLS = enhanced ? ENHANCED_COLS : BASE_COLS

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  if (!holdings.length) {
    return (
      <div className="px-5 py-8 text-sm text-center font-medium text-muted">
        No holdings found.
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto no-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-background/90 backdrop-blur-xl z-20 shadow-sm border-b border-border/50">
          <tr>
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group transition-colors"
                style={{ color: sortKey === key ? '#FFFFFF' : '#a1a1aa' }}
                onClick={() => handleSort(key)}
              >
                <div className="flex items-center gap-1 group-hover:text-white transition-colors">
                  {label}
                  {sortKey === key && (
                    sortDir === 'asc' ? <ChevronUp size={12} strokeWidth={2.5} className="text-white" /> : <ChevronDown size={12} strokeWidth={2.5} className="text-white" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h, i) => (
            <motion.tr
              key={h.ticker || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="border-b border-border/30 hover:bg-white/5 transition-colors group cursor-default"
            >
              {COLS.map(({ key }) => (
                <td
                  key={key}
                  className={`px-4 py-3 text-sm transition-colors ${
                    key === 'ticker' || key === 'unrealized_pnl' || key === 'shares' || key === 'current_price' || key === 'market_value' ? 'font-mono' : 'font-sans font-medium text-muted group-hover:text-white/80'
                  }`}
                  style={
                    key === 'ticker'
                      ? { color: '#FFFFFF', fontWeight: 500 }
                      : (key === 'unrealized_pnl' || key === 'day_change_pct') && h[key] != null
                      ? { color: h[key] >= 0 ? '#10B981' : '#EF4444', fontWeight: 500 }
                      : {}
                  }
                >
                  <span className={key === 'ticker' ? 'bg-white/10 px-2 py-1 rounded text-xs tracking-wide' : ''}>
                    {formatCell(key, h[key])}
                  </span>
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



