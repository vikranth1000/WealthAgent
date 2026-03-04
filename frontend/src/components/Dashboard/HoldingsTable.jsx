import { useState } from 'react'

const BASE_COLS = [
  { key: 'ticker', label: 'TICKER' },
  { key: 'shares', label: 'SHARES' },
  { key: 'asset_class', label: 'CLASS' },
]

const ENHANCED_COLS = [
  { key: 'ticker', label: 'TICKER' },
  { key: 'shares', label: 'SHARES' },
  { key: 'current_price', label: 'PX' },
  { key: 'market_value', label: 'VALUE' },
  { key: 'unrealized_pnl', label: 'P&L' },
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
      <div className="px-3 py-4 text-[11px] font-mono" style={{ color: '#444444' }}>
        NO HOLDINGS
      </div>
    )
  }

  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0, background: '#111111', zIndex: 1 }}>
        <tr style={{ borderBottom: '1px solid #1E1E1E' }}>
          {COLS.map(({ key, label }) => (
            <th
              key={key}
              className="px-3 py-1.5 text-left cursor-pointer select-none text-[10px] uppercase tracking-wider font-mono"
              style={{ color: sortKey === key ? '#FF9900' : '#888888' }}
              onClick={() => handleSort(key)}
            >
              {label}{sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((h, i) => (
          <tr
            key={h.ticker || i}
            style={{ borderBottom: '1px solid #1A1A1A' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1A1A1A')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {COLS.map(({ key }) => (
              <td
                key={key}
                className="px-3 py-2 text-[12px] font-mono"
                style={{
                  color:
                    key === 'ticker'
                      ? '#FF9900'
                      : key === 'unrealized_pnl'
                      ? h[key] >= 0
                        ? '#00C805'
                        : '#FF3B30'
                      : '#FFFFFF',
                }}
              >
                {formatCell(key, h[key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
