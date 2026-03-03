import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export default function InlineTable({ data }) {
  const { columns, rows } = data || {}
  const [sortIdx, setSortIdx] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  if (!columns?.length || !rows?.length) return null

  function handleSort(idx) {
    if (sortIdx === idx) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortIdx(idx)
      setSortDir('asc')
    }
  }

  const sorted = sortIdx !== null
    ? [...rows].sort((a, b) => {
        const av = a[sortIdx] ?? ''
        const bv = b[sortIdx] ?? ''
        const numA = Number(String(av).replace(/[$,%+]/g, ''))
        const numB = Number(String(bv).replace(/[$,%+]/g, ''))
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    : rows

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-xs">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider font-sans bg-white/[0.04] border-b border-white/[0.08] cursor-pointer select-none hover:bg-white/[0.06] transition-colors"
                style={sortIdx === idx ? { color: 'var(--persona-primary)' } : undefined}
                onClick={() => handleSort(idx)}
              >
                <span className={`flex items-center gap-1 ${sortIdx !== idx ? 'text-slate-600' : ''}`}>
                  {col}
                  {sortIdx === idx ? (
                    sortDir === 'asc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
                  ) : (
                    <ChevronUp size={10} className="text-slate-700" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr key={ri} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
              {row.map((cell, ci) => {
                const str = String(cell ?? '')
                const isNeg = str.startsWith('-')
                const isPos = str.startsWith('+')
                return (
                  <td
                    key={ci}
                    className={`px-3 py-2 text-xs font-mono ${
                      isNeg ? 'text-rose-400' : isPos ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
