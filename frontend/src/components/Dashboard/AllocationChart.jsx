import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnimatedObject } from '../../hooks/useAnimatedValue'

const COLORS = ['#1B2A4A', '#0D9488', '#F59E0B', '#7C3AED', '#3B82F6', '#EF4444']
const RADIAN = Math.PI / 180

function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// Props: data — object like { "US Equity": 0.6, "Bond": 0.3, "Cash": 0.1 }
export default function AllocationChart({ data }) {
  // Animate between allocation objects so pie sectors morph smoothly
  const animated = useAnimatedObject(data)

  const chartData = useMemo(() => {
    if (!animated || Object.keys(animated).length === 0) return []
    return Object.entries(animated)
      .filter(([, value]) => value > 0.001)
      .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
  }, [animated])

  // Legend is driven by the target data so labels never show ghost categories
  // that are only present because they're still animating out.
  const legendData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return []
    return Object.entries(data)
      .filter(([, value]) => value > 0.001)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-40 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm">
        No allocation data
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="42%"
            outerRadius="78%"
            dataKey="value"
            labelLine={false}
            label={PctLabel}
            strokeWidth={2}
            stroke="#fff"
            isAnimationActive={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => `${v.toFixed(1)}%`}
            contentStyle={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontSize: '11px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend driven by target data — no ghost labels during morph */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 px-2">
        {legendData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
