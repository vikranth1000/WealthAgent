import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useAnimatedObject } from '../../hooks/useAnimatedValue'

export default function SectorChart({ data }) {
  const animated = useAnimatedObject(data, 400)
  const targetKeys = useMemo(() => new Set(data ? Object.keys(data) : []), [data])

  const chartData = useMemo(() => {
    if (!animated || Object.keys(animated).length === 0) return []
    return Object.entries(animated)
      .filter(([name, value]) => value > 0.001 && targetKeys.has(name))
      .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
      .sort((a, b) => (data[b.name] ?? 0) - (data[a.name] ?? 0))
  }, [animated, targetKeys, data])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] font-mono" style={{ color: '#444444' }}>
        NO DATA
      </div>
    )
  }

  const height = Math.max(80, Object.keys(data).length * 28 + 16)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="1 4" stroke="#1E1E1E" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={92}
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => `${v.toFixed(1)}%`}
          contentStyle={{
            background: '#111111',
            border: '1px solid #FF9900',
            borderRadius: 0,
            color: '#FFFFFF',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
          cursor={{ fill: 'rgba(255,153,0,0.05)' }}
        />
        <Bar dataKey="value" fill="#FF9900" radius={0} isAnimationActive={false}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v.toFixed(1)}%`}
            style={{ fontSize: 10, fill: '#FF9900', fontFamily: 'monospace' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
