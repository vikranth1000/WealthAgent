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
      <div className="h-full flex items-center justify-center text-sm text-muted font-medium">
        No performance history available.
      </div>
    )
  }

  const firstPoint = data[0]
  const lastPoint = data[data.length - 1]
  const isPositive = (lastPoint.value - firstPoint.value) >= 0

  const strokeColor = isPositive ? '#10B981' : '#EF4444' // Emerald or Red

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="perfGradientUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="perfGradientDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickFormatter={formatXTick}
          interval="preserveStartEnd"
          dy={10}
          tickCount={6}
        />
        <YAxis
          tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: '"SF Mono", monospace', fontWeight: 500 }}
          tickLine={false}
          tickFormatter={formatYTick}
          width={56}
          dx={-10}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [formatTooltipValue(v), 'Portfolio Value']}
          contentStyle={{
            background: '#101010',
            border: '1px solid #2A2A2A',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Inter, sans-serif',
            padding: '8px 12px'
          }}
          labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          itemStyle={{ color: strokeColor, fontFamily: '"SF Mono", monospace', fontWeight: 600 }}
          cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${isPositive ? 'perfGradientUp' : 'perfGradientDown'})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        {lastPoint && (
          <ReferenceDot
            x={lastPoint.date}
            y={lastPoint.value}
            r={4}
            fill={strokeColor}
            stroke="#1C1C1E"
            strokeWidth={1.5}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}


