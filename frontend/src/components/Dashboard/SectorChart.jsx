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
      <div className="h-full flex items-center justify-center text-sm text-muted font-medium">
        No sector data available.
      </div>
    )
  }

  const height = Math.max(80, Object.keys(data).length * 40 + 20)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 48, left: 4, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => `${v.toFixed(1)}%`}
          contentStyle={{
            background: '#101010',
            border: '1px solid #2A2A2A',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Inter, sans-serif',
            padding: '8px 12px'
          }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="value" fill="#FFFFFF" radius={[0, 2, 2, 0]} isAnimationActive={true} animationDuration={1000} barSize={12}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v.toFixed(1)}%`}
            style={{ fontSize: 11, fill: '#FFFFFF', fontFamily: '"SF Mono", monospace', fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}


