import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const BASE_COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'asset_class', label: 'Class' },
]

const ENHANCED_COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'current_price', label: 'Price' },
  { key: 'market_value', label: 'Value' },
  { key: 'unrealized_pnl', label: 'P&L' },
]

function SortIcon({ active, dir }) {
  if (!active) return <ChevronUp size={10} style={{ color: '#c7c7cc' }} />
  return dir === 'asc'
    ? <ChevronDown size={10} style={{ color: 'var(--persona-primary)' }} />
    : <ChevronUp size={10} style={{ color: 'var(--persona-primary)' }} />
}

function formatCell(key, value) {
  if (value == null) return '—'
  if (key === 'shares') return typeof value === 'number' ? value.toFixed(1) : value
  if (key === 'current_price') return `$${value.toFixed(2)}`
  if (key === 'market_value') return `$${Math.round(value).toLocaleString()}`
  if (key === 'unrealized_pnl') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}$${Math.round(value).toLocaleString()}`
  }
  if (key === 'unrealized_pnl_pct') {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }
  return String(value)
}

export default function HoldingsTable({ holdings = [], enhanced = false }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  if (!holdings.length) {
    return (
      <div className="text-[13px] text-center py-6" style={{ color: '#6e6e73' }}>
        No holdings
      </div>
    )
  }

  const COLS = enhanced ? ENHANCED_COLS : BASE_COLS

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(255,255,255,0.90)',
            zIndex: 1,
          }}
        >
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                className="px-2 pb-2.5 text-left cursor-pointer select-none transition-colors"
                style={{ color: '#6e6e73' }}
                onClick={() => handleSort(key)}
              >
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout" initial={false}>
            {sorted.map((h, i) => (
              <motion.tr
                key={h.ticker || i}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.02 }}
                className="transition-colors cursor-default"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {COLS.map(({ key }) => (
                  <td
                    key={key}
                    className="px-2 py-2.5 font-mono text-xs"
                    style={{
                      color: key === 'ticker' ? '#1c1c1e' : '#48484a',
                      fontWeight: key === 'ticker' ? 600 : 400,
                    }}
                  >
                    {key === 'unrealized_pnl' ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          color: h[key] >= 0 ? '#34C759' : '#FF3B30',
                          background: h[key] >= 0 ? 'rgba(52,199,89,0.10)' : 'rgba(255,59,48,0.10)',
                        }}
                      >
                        {formatCell(key, h[key])}
                      </span>
                    ) : key === 'ticker' ? (
                      h.ticker
                    ) : (
                      formatCell(key, h[key])
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
