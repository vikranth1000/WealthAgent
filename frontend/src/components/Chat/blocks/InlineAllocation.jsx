import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#1B2A4A', '#0D9488', '#F59E0B', '#7C3AED', '#3B82F6', '#EF4444']
const RADIAN = Math.PI / 180

function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function InlineAllocation({ data }) {
  const chartData = useMemo(() => {
    if (!data || typeof data !== 'object') return []
    return Object.entries(data)
      .filter(([, v]) => v > 0.001)
      .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  if (!chartData.length) return null

  return (
    <div className="my-2 rounded-xl border border-gray-200 bg-white p-2">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="76%"
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
            contentStyle={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '11px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 px-2">
        {chartData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
