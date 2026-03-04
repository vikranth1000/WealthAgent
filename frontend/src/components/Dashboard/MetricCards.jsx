import { motion } from 'framer-motion'
import NumberFlow from '@number-flow/react'

const CARDS = [
  {
    key: 'totalValue',
    label: 'Total Value',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    color: () => 'var(--persona-primary)',
  },
  {
    key: 'ytdReturn',
    label: 'YTD Return',
    format: { style: 'percent', signDisplay: 'always', maximumFractionDigits: 1 },
    color: (v) => (v >= 0 ? '#34C759' : '#FF3B30'),
  },
  {
    key: 'sharpe',
    label: 'Sharpe Ratio',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    color: () => '#48484a',
  },
  {
    key: 'maxDrawdown',
    label: 'Max Drawdown',
    format: { style: 'percent', maximumFractionDigits: 1 },
    color: () => '#FF3B30',
  },
]

export default function MetricCards({ metrics = {} }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CARDS.map(({ key, label, format, color }, i) => {
        const value = metrics[key] ?? null

        return (
          <motion.div
            key={key}
            className="magic-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: i * 0.06 }}
            whileHover={{ y: -2 }}
          >
            <div className="magic-card-inner px-4 py-3 h-full">
              <p className="apple-label mb-2">{label}</p>
              {value != null ? (
                <NumberFlow
                  value={value}
                  format={format}
                  className="font-semibold leading-none"
                  style={{ fontSize: '22px', color: color(value) }}
                />
              ) : (
                <span className="font-semibold leading-none" style={{ fontSize: '22px', color: '#c7c7cc' }}>
                  —
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
