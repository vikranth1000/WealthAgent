import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

const COLS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'shares', label: 'Shares' },
  { key: 'asset_class', label: 'Class' },
  { key: 'sector', label: 'Sector' },
]

function SortIcon({ active, dir }) {
  if (!active) return <ChevronUp size={10} className="text-gray-300" />
  return dir === 'asc' ? <ChevronDown size={10} className="text-teal" /> : <ChevronUp size={10} className="text-teal" />
}

// Props: holdings — array of { ticker, shares, cost_basis, asset_class, sector }
// Click column headers to sort. Zebra-striped rows.
export default function HoldingsTable({ holdings = [] }) {
  const [sortKey, setSortKey] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')

  if (!holdings.length) {
    return (
      <div className="text-gray-400 text-sm text-center py-4 rounded-lg bg-gray-50 border border-gray-200">
        No holdings
      </div>
    )
  }

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
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                className="px-2 py-2 text-left font-semibold text-gray-500 cursor-pointer select-none hover:bg-gray-100 transition-colors"
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
            <tr key={h.ticker || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-1.5 font-semibold text-navy">{h.ticker}</td>
              <td className="px-2 py-1.5 text-gray-600">
                {typeof h.shares === 'number' ? h.shares.toFixed(2) : h.shares}
              </td>
              <td className="px-2 py-1.5 text-gray-600">{h.asset_class}</td>
              <td className="px-2 py-1.5 text-gray-500">{h.sector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
