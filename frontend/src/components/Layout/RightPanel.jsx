import { X } from 'lucide-react'
import MetricCards from '../Dashboard/MetricCards.jsx'
import AllocationChart from '../Dashboard/AllocationChart.jsx'
import PerformanceChart from '../Dashboard/PerformanceChart.jsx'
import SectorChart from '../Dashboard/SectorChart.jsx'
import HoldingsTable from '../Dashboard/HoldingsTable.jsx'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export default function RightPanel({ client, portfolioData, isOpen, onClose, width, onResizeStart }) {
  const { portfolio, analysis, performanceHistory, holdingsDetail, loading, error } = portfolioData

  if (!isOpen) return null

  const metrics = analysis
    ? {
        totalValue: analysis.total_value,
        ytdReturn: analysis.total_return,
        sharpe: analysis.sharpe_ratio,
        maxDrawdown: analysis.max_drawdown,
      }
    : {}

  // Use holdingsDetail if available (has prices + P&L), fallback to portfolio holdings
  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings

  return (
    <aside
      className="relative shrink-0 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden"
      style={{ width: `${width}px` }}
    >
      <div
        className="absolute top-0 left-0 h-full w-1.5 -translate-x-1/2 cursor-col-resize hover:bg-teal/20 transition-colors"
        onMouseDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize dashboard panel"
      />
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h2 className="text-[13px] font-semibold text-navy">Portfolio Dashboard</h2>
          {client && <p className="text-[11px] text-gray-500 mt-0.5">{client.name}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm px-4 text-center">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div key={client?.id} className="flex-1 overflow-y-auto p-4 space-y-4">
          <MetricCards metrics={metrics} />

          <Section title="Asset Allocation">
            <AllocationChart data={analysis?.current_allocation} />
          </Section>

          <Section title="Performance">
            <PerformanceChart data={performanceHistory} />
          </Section>

          <Section title="Sector Exposure">
            <SectorChart data={analysis?.sector_breakdown} />
          </Section>

          <Section title="Holdings">
            <HoldingsTable holdings={displayHoldings} enhanced={holdingsDetail.length > 0} />
          </Section>
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-200 bg-white shrink-0">
        <p className="text-[10px] text-gray-400 text-center">
          Charts powered by Recharts &middot; Data from yfinance
        </p>
      </div>
    </aside>
  )
}
