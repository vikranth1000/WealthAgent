import NumberFlow from '@number-flow/react'
import { motion } from 'framer-motion'

export default function HeroCard({ client, analysis }) {
  return (
    <motion.div
      className="apple-glass-primary rounded-[20px] p-6 flex flex-col justify-between min-h-[148px]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <p className="apple-label">Total Value</p>

      <div className="mt-2">
        {analysis ? (
          <NumberFlow
            value={analysis.total_value ?? 0}
            format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
            className="font-semibold block"
            style={{
              fontSize: '3.25rem',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--persona-primary)',
              filter: 'drop-shadow(0 0 24px color-mix(in srgb, var(--persona-primary) 30%, transparent))',
            }}
          />
        ) : (
          <div className="h-12 w-56 rounded-xl bg-black/[0.06] animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-2.5 mt-4 flex-wrap">
        {client && (
          <span className="text-[13px] font-semibold" style={{ color: '#1c1c1e' }}>
            {client.name}
          </span>
        )}
        {analysis && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-mono"
            style={{
              color: analysis.total_return >= 0 ? '#34C759' : '#FF3B30',
              background: analysis.total_return >= 0
                ? 'rgba(52,199,89,0.12)'
                : 'rgba(255,59,48,0.12)',
            }}
          >
            {analysis.total_return >= 0 ? '+' : ''}
            {(analysis.total_return * 100).toFixed(1)}% YTD
          </span>
        )}
        {client && (
          <span className="text-[12px] capitalize" style={{ color: '#6e6e73' }}>
            {client.persona?.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </motion.div>
  )
}
