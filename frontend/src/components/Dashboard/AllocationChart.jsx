import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#1B2A4A', '#0D9488', '#F59E0B', '#7C3AED', '#3B82F6', '#EF4444']
const RADIAN = Math.PI / 180

function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// Props: data — object like { "US Equity": 0.6, "Bond": 0.3, "Cash": 0.1 }
export default function AllocationChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No allocation data
      </div>
    )
  }

  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value: parseFloat((value * 100).toFixed(1)),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="42%"
          innerRadius={45}
          outerRadius={75}
          dataKey="value"
          labelLine={false}
          label={PctLabel}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  )
}
