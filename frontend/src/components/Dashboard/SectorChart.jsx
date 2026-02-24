import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from 'recharts'
import { useAnimatedObject } from '../../hooks/useAnimatedValue'

// Props: data — object like { "Technology": 0.45, "Fixed Income": 0.3, ... }
export default function SectorChart({ data }) {
  const animated = useAnimatedObject(data, 1400)

  // Only include rows present in the target data so ghost sectors
  // don't linger in the Y-axis while they animate out.
  const targetKeys = useMemo(() => new Set(data ? Object.keys(data) : []), [data])

  const chartData = useMemo(() => {
    if (!animated || Object.keys(animated).length === 0) return []
    return Object.entries(animated)
      .filter(([name, value]) => value > 0.001 && targetKeys.has(name))
      .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
      .sort((a, b) => (data[b.name] ?? 0) - (data[a.name] ?? 0))
  }, [animated, targetKeys])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        No sector data
      </div>
    )
  }

  // Base height on target data so the chart doesn't resize mid-animation
  const height = Math.max(80, Object.keys(data).length * 28 + 16)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
        <Bar dataKey="value" fill="#0D9488" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v.toFixed(1)}%`}
            style={{ fontSize: 11, fill: '#6B7280' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
