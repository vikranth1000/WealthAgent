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
    <div className="my-2 overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-xs">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                onClick={() => handleSort(idx)}
              >
                <span className="flex items-center gap-1">
                  {col}
                  {sortIdx === idx ? (
                    sortDir === 'asc' ? <ChevronDown size={10} className="text-teal" /> : <ChevronUp size={10} className="text-teal" />
                  ) : (
                    <ChevronUp size={10} className="text-gray-300" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
              {row.map((cell, ci) => {
                const isFirst = ci === 0
                const str = String(cell ?? '')
                const isNeg = str.startsWith('-')
                const isPos = str.startsWith('+')
                return (
                  <td
                    key={ci}
                    className={`px-2.5 py-1.5 ${
                      isFirst ? 'font-semibold text-navy' : 'text-gray-600'
                    } ${isNeg ? 'text-red-500 font-medium' : ''} ${isPos ? 'text-green-600 font-medium' : ''}`}
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
