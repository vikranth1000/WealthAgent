import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer, CartesianGrid } from 'recharts'

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
    <div className="my-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2">
      {title && (
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide px-1 mb-1 font-sans">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: '#475569', fontSize: 11, fontFamily: '"Geist Mono"' }}
          />
          <Tooltip
            formatter={(v) => `${v.toFixed(1)}%`}
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '0.75rem',
              color: '#94A3B8',
              fontFamily: '"Geist Mono"',
              fontSize: 11,
            }}
          />
          <Bar dataKey="value" fill="var(--persona-primary)" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            <LabelList dataKey="value" position="right" formatter={(v) => `${v.toFixed(1)}%`} style={{ fontSize: 10, fill: '#94A3B8' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
