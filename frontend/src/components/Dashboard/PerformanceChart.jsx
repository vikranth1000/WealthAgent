import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from 'recharts'

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
      <div className="h-40 flex items-center justify-center rounded-xl text-slate-500 text-sm">
        No historical data available
      </div>
    )
  }

  const lastPoint = data[data.length - 1]

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--persona-primary)" stopOpacity={0.20} />
            <stop offset="95%" stopColor="var(--persona-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#475569', fontSize: 11, fontFamily: '"Geist Mono"' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 11, fontFamily: '"Geist Mono"' }}
          tickLine={false}
          tickFormatter={formatYTick}
          width={48}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [formatTooltipValue(v), 'Value']}
          contentStyle={{
            background: 'rgba(8,13,26,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            color: '#CBD5E1',
            fontSize: '12px',
            fontFamily: '"Geist Mono", monospace',
          }}
          labelStyle={{ marginBottom: 2, fontSize: '10px', color: '#475569' }}
          itemStyle={{ margin: 0, padding: 0, fontSize: '11px', color: 'var(--persona-primary)' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--persona-primary)"
          strokeWidth={2}
          fill="url(#perfGradient)"
          dot={false}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
        {lastPoint && (
          <ReferenceDot
            x={lastPoint.date}
            y={lastPoint.value}
            r={4}
            fill="var(--persona-primary)"
            stroke="var(--persona-primary)"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
