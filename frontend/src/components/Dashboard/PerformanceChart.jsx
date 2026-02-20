import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatYTick(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function formatTooltipValue(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

// Props: data — array of { date: string, value: number }
export default function PerformanceChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm">
        No historical data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 9 }}
          tickLine={false}
          tickFormatter={formatYTick}
          width={48}
        />
        <Tooltip
          formatter={(v) => [formatTooltipValue(v), 'Value']}
          contentStyle={{
            padding: '4px 6px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            fontSize: '10px',
            lineHeight: 1.2,
          }}
          labelStyle={{ marginBottom: 2, fontSize: '10px' }}
          itemStyle={{ margin: 0, padding: 0, fontSize: '10px' }}
        />
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
