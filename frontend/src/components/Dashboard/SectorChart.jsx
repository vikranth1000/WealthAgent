import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from 'recharts'

// Props: data — object like { "Technology": 0.45, "Fixed Income": 0.3, ... }
// Bars sorted descending by value. Teal fill. Percentage labels on right.
export default function SectorChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        No sector data
      </div>
    )
  }

  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }))
    .sort((a, b) => b.value - a.value)

  const height = Math.max(80, chartData.length * 28 + 16)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="value" fill="#0D9488" radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v}%`}
            style={{ fontSize: 11, fill: '#6B7280' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
