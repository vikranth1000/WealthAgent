import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from 'recharts'

export default function InlineBarChart({ data }) {
  const entries = data?.data
  const title = data?.title

  const chartData = useMemo(() => {
    if (!entries || typeof entries !== 'object') return []
    return Object.entries(entries)
      .filter(([, v]) => v > 0.001)
      .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  if (!chartData.length) return null

  const height = Math.max(80, chartData.length * 28 + 16)

  return (
    <div className="my-2 rounded-xl border border-gray-200 bg-white p-2">
      {title && (
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1 mb-1">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
          <Bar dataKey="value" fill="#0D9488" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            <LabelList dataKey="value" position="right" formatter={(v) => `${v.toFixed(1)}%`} style={{ fontSize: 10, fill: '#6B7280' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
