import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnimatedObject } from '../../hooks/useAnimatedValue'

const COLORS = ['#3B82F6', '#0D9488', '#F59E0B', '#A855F7', '#F43F5E', '#06B6D4']
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
      fill="#94A3B8"
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
      <div className="h-40 flex items-center justify-center rounded-xl text-slate-500 text-sm">
        No allocation data
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
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
              stroke="rgba(255,255,255,0.08)"
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => `${v.toFixed(1)}%`}
              contentStyle={{
                background: 'rgba(8,13,26,0.95)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                color: '#CBD5E1',
                fontSize: '12px',
                fontFamily: '"Geist Mono", monospace',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Vertical legend with percentages */}
      <div className="flex flex-col gap-1.5 shrink-0 pr-1">
        {legendData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-slate-400 whitespace-nowrap">{entry.name}</span>
            <span className="text-[11px] font-medium text-slate-500 tabular-nums ml-auto">
              {(entry.value * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
