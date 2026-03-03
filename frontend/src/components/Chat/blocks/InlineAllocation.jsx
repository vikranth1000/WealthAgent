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
    <div className="my-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2">
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
            stroke="rgba(255,255,255,0.1)"
            isAnimationActive={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => `${v.toFixed(1)}%`}
            contentStyle={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.9)', color: '#e2e8f0', fontSize: '11px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 px-2">
        {chartData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] text-slate-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
