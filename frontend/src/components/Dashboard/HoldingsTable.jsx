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
  if (!active) return <ChevronUp size={10} className="text-slate-700" />
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

// Props: holdings — array, enhanced — boolean (if true, data includes price/value/pnl)
export default function HoldingsTable({ holdings = [], enhanced = false }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  if (!holdings.length) {
    return (
      <div className="text-slate-500 text-sm text-center py-4">
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
        <thead>
          <tr className="border-b border-white/[0.08]">
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                className="px-2 pb-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-700 font-sans cursor-pointer hover:text-slate-400 transition-colors select-none"
                onClick={() => handleSort(key)}
              >
                <span className="flex items-center gap-1">
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
                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
              >
                {COLS.map(({ key }) => (
                  <td
                    key={key}
                    className={
                      key === 'ticker'
                        ? 'px-2 py-2.5 font-mono font-semibold text-slate-300 text-xs'
                        : 'px-2 py-2.5 font-mono text-xs text-slate-500'
                    }
                  >
                    {key === 'unrealized_pnl' ? (
                      <span className={
                        h[key] >= 0
                          ? 'rounded-full px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10'
                          : 'rounded-full px-1.5 py-0.5 font-mono text-[10px] text-rose-400 bg-rose-500/10'
                      }>
                        {formatCell(key, h[key])}
                      </span>
                    ) : key === 'ticker' ? h.ticker : formatCell(key, h[key])}
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
