import { X } from 'lucide-react'
import { usePortfolio } from '../../hooks/usePortfolio.js'
import MetricCards from '../Dashboard/MetricCards.jsx'
import AllocationChart from '../Dashboard/AllocationChart.jsx'
import PerformanceChart from '../Dashboard/PerformanceChart.jsx'
import SectorChart from '../Dashboard/SectorChart.jsx'
import HoldingsTable from '../Dashboard/HoldingsTable.jsx'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

// analysis shape: { total_value, total_return, current_allocation, target_allocation,
//                   sector_breakdown, sharpe_ratio, sortino_ratio, max_drawdown, volatility }
// portfolio shape: { holdings: [...] }
export default function RightPanel({ client, isOpen, onClose }) {
  const { portfolio, analysis, loading, error } = usePortfolio(client?.id)

  if (!isOpen) return null

  const metrics = analysis
    ? {
        totalValue: analysis.total_value,
        ytdReturn: analysis.total_return,
        sharpe: analysis.sharpe_ratio,
        maxDrawdown: analysis.max_drawdown,
      }
    : {}

  return (
    <aside className="w-80 shrink-0 flex flex-col bg-light-gray border-l border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-navy">Portfolio Dashboard</h2>
          {client && <p className="text-xs text-gray-500 mt-0.5">{client.name}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading portfolio…
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm px-4 text-center">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <MetricCards metrics={metrics} />

          <Section title="Asset Allocation">
            <AllocationChart data={analysis?.current_allocation} />
          </Section>

          <Section title="Performance">
            <PerformanceChart data={[]} />
          </Section>

          <Section title="Sector Exposure">
            <SectorChart data={analysis?.sector_breakdown} />
          </Section>

          <Section title="Holdings">
            <HoldingsTable holdings={portfolio?.holdings} />
          </Section>
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-200 bg-white shrink-0">
        <p className="text-xs text-gray-400 text-center">
          Charts powered by Recharts · Data from yfinance
        </p>
      </div>
    </aside>
  )
}
