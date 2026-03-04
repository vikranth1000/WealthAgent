import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from 'recharts'

function formatYTick(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function formatXTick(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '")
}

function formatTooltipValue(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

export default function PerformanceChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] font-mono" style={{ color: '#444444' }}>
        NO DATA
      </div>
    )
  }

  const lastPoint = data[data.length - 1]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9900" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#FF9900" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 4" stroke="#1E1E1E" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#1E1E1E' }}
          tickFormatter={formatXTick}
          interval="preserveStartEnd"
          tickCount={6}
        />
        <YAxis
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          tickFormatter={formatYTick}
          width={52}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [formatTooltipValue(v), 'VALUE']}
          contentStyle={{
            background: '#111111',
            border: '1px solid #FF9900',
            borderRadius: 0,
            color: '#FFFFFF',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
          labelStyle={{ color: '#FF9900', fontSize: '10px', marginBottom: '2px' }}
          itemStyle={{ color: '#FFFFFF' }}
          cursor={{ stroke: '#FF9900', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FF9900"
          strokeWidth={1.5}
          fill="url(#perfGradient)"
          dot={false}
          isAnimationActive={false}
        />
        {lastPoint && (
          <ReferenceDot
            x={lastPoint.date}
            y={lastPoint.value}
            r={3}
            fill="#FF9900"
            stroke="#0D0D0D"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
