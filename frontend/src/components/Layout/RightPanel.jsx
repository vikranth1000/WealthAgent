import MetricCards from '../Dashboard/MetricCards.jsx'
import AllocationChart from '../Dashboard/AllocationChart.jsx'
import PerformanceChart from '../Dashboard/PerformanceChart.jsx'
import SectorChart from '../Dashboard/SectorChart.jsx'
import HoldingsTable from '../Dashboard/HoldingsTable.jsx'

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 font-sans">
        {title}
      </p>
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white/[0.05] border border-white/[0.06] px-3 py-2.5">
            <div className="h-2.5 w-14 rounded-full bg-white/[0.08] animate-pulse mb-2" />
            <div className="h-5 w-20 rounded-full bg-white/[0.08] animate-pulse" />
          </div>
        ))}
      </div>
      {[32, 40, 32, 48].map((h, i) => (
        <div
          key={i}
          className="rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
          style={{ height: `${h * 4}px` }}
        />
      ))}
    </div>
  )
}

export default function RightPanel({ client, portfolioData }) {
  const { portfolio, analysis, performanceHistory, holdingsDetail, loading, error } = portfolioData

  const metrics = analysis ? {
    totalValue: analysis.total_value,
    ytdReturn: analysis.total_return,
    sharpe: analysis.sharpe_ratio,
    maxDrawdown: analysis.max_drawdown,
  } : {}

  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings

  return (
    <div className="flex flex-col h-full">
      {/* Client header */}
      <div className="px-6 pt-6 pb-5 shrink-0 border-b border-white/[0.06]">
        {client ? (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 mb-2 font-sans">
              Portfolio
            </p>
            <h2 className="font-display text-xl font-semibold text-slate-100 leading-snug">
              {client.name}
            </h2>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-xs text-slate-600 font-sans capitalize">
                {client.persona?.replace(/_/g, ' ')}
              </span>
              {analysis && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium font-mono"
                  style={{
                    color: analysis.total_return >= 0 ? '#34D399' : '#F87171',
                    background: analysis.total_return >= 0
                      ? 'rgba(52,211,153,0.10)'
                      : 'rgba(248,113,113,0.10)',
                  }}
                >
                  {analysis.total_return >= 0 ? '+' : ''}
                  {(analysis.total_return * 100).toFixed(1)}% YTD
                </span>
              )}
            </div>
            {analysis && (
              <p
                className="font-mono text-3xl font-semibold mt-3 transition-all duration-700"
                style={{ color: 'var(--persona-primary)' }}
              >
                $
                {analysis.total_value?.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="h-2.5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-6 w-40 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-8 w-32 rounded-full bg-white/[0.06] animate-pulse mt-3" />
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-rose-400/60 text-sm px-6 text-center font-sans">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div key={client?.id} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
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
    </div>
  )
}
