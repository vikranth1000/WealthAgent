import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Props: data — array of { date: string, value: number }
// No historical data from API yet — shows placeholder message until wired.
export default function PerformanceChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-sm">
        No historical data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0D9488"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
