import { useState } from 'react'
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
  { key: 'market_value', label: 'Value' },
  { key: 'unrealized_pnl', label: 'P&L' },
]

function SortIcon({ active, dir }) {
  if (!active) return <ChevronUp size={10} className="text-gray-300" />
  return dir === 'asc' ? <ChevronDown size={10} className="text-teal" /> : <ChevronUp size={10} className="text-teal" />
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

function cellColor(key, value) {
  if (key === 'unrealized_pnl' || key === 'unrealized_pnl_pct') {
    return value >= 0 ? 'text-green-600' : 'text-red-500'
  }
  return ''
}

// Props: holdings — array, enhanced — boolean (if true, data includes price/value/pnl)
export default function HoldingsTable({ holdings = [], enhanced = false }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  if (!holdings.length) {
    return (
      <div className="text-gray-400 text-sm text-center py-4 rounded-xl bg-gray-50 border border-gray-200">
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
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-xs">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
          <tr>
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:bg-gray-100 transition-colors"
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
          {sorted.map((h, i) => (
            <tr key={h.ticker || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
              {COLS.map(({ key }) => (
                <td
                  key={key}
                  className={`px-2 py-1.5 ${
                    key === 'ticker' ? 'font-semibold text-navy' : `text-gray-600 ${cellColor(key, h[key])}`
                  } ${key === 'unrealized_pnl' ? 'font-medium' : ''}`}
                >
                  {key === 'ticker' ? h.ticker : formatCell(key, h[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
