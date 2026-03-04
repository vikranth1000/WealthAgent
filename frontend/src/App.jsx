import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import PerformanceChart from './components/Dashboard/PerformanceChart.jsx'
import SectorChart from './components/Dashboard/SectorChart.jsx'
import HoldingsTable from './components/Dashboard/HoldingsTable.jsx'
import ChatBar from './components/Chat/ChatBar.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

function SectionHeader({ children }) {
  return (
    <div
      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shrink-0"
      style={{ color: '#FF9900', borderBottom: '1px solid #1E1E1E' }}
    >
      {children}
    </div>
  )
}

function MetricRow({ label, value, valueColor }) {
  const total = 22
  const dots = '·'.repeat(Math.max(1, total - label.length - String(value ?? '—').length))
  return (
    <div className="flex items-baseline text-[12px] font-mono leading-5">
      <span style={{ color: '#888888' }}>{label}</span>
      <span className="flex-1" style={{ color: '#2A2A2A', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {dots}
      </span>
      <span style={{ color: valueColor ?? '#FFFFFF' }}>{value ?? '—'}</span>
    </div>
  )
}

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) setSelectedClient(clients[0])
  }, [clients, selectedClient])

  const { portfolio, analysis, performanceHistory, holdingsDetail, loading } = portfolioData
  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings ?? []

  const alloc = analysis?.current_allocation
    ? Object.entries(analysis.current_allocation)
        .filter(([, v]) => v > 0.001)
        .sort((a, b) => b[1] - a[1])
    : []

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden font-mono"
      style={{ background: '#0D0D0D', color: '#FFFFFF' }}
    >
      {/* ── Top bar ── */}
      <div
        className="shrink-0 flex items-center"
        style={{ height: '40px', background: '#111111', borderBottom: '1px solid #1E1E1E' }}
      >
        <div
          className="shrink-0 flex items-center px-4 h-full"
          style={{ borderRight: '1px solid #1E1E1E' }}
        >
          <span
            className="text-[11px] font-bold tracking-[0.15em] uppercase"
            style={{ color: '#FF9900' }}
          >
            ▸ WEALTHAGENT
          </span>
        </div>
        <PersonaPills
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
        />
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar */}
        <div
          className="shrink-0 flex flex-col overflow-y-auto"
          style={{ width: '260px', borderRight: '1px solid #1E1E1E', background: '#111111' }}
        >
          {/* Portfolio summary */}
          <SectionHeader>Portfolio</SectionHeader>
          <div className="px-3 py-3 shrink-0">
            <div className="text-[12px] font-bold" style={{ color: '#FFFFFF' }}>
              {selectedClient?.name ?? '—'}
            </div>
            <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: '#888888' }}>
              {selectedClient?.persona?.replace(/_/g, ' ') ?? ''}
            </div>
            <div
              className="font-bold leading-none mt-3"
              style={{ fontSize: '1.9rem', color: '#FF9900', letterSpacing: '-0.02em' }}
            >
              {loading
                ? '———'
                : analysis
                ? `$${Math.round(analysis.total_value).toLocaleString()}`
                : '—'}
            </div>
            {analysis && (
              <div
                className="text-[12px] mt-1 font-mono"
                style={{ color: analysis.total_return >= 0 ? '#00C805' : '#FF3B30' }}
              >
                {analysis.total_return >= 0 ? '+' : ''}
                {(analysis.total_return * 100).toFixed(1)}% YTD
              </div>
            )}
          </div>

          {/* Key metrics */}
          <SectionHeader>Key Metrics</SectionHeader>
          <div className="px-3 py-2.5 flex flex-col gap-1.5 shrink-0">
            {loading ? (
              <div className="text-[11px]" style={{ color: '#444444' }}>LOADING...</div>
            ) : analysis ? (
              <>
                <MetricRow
                  label="YTD RETURN"
                  value={`${analysis.total_return >= 0 ? '+' : ''}${(analysis.total_return * 100).toFixed(1)}%`}
                  valueColor={analysis.total_return >= 0 ? '#00C805' : '#FF3B30'}
                />
                <MetricRow
                  label="SHARPE RATIO"
                  value={analysis.sharpe_ratio?.toFixed(2)}
                />
                <MetricRow
                  label="MAX DRAWDOWN"
                  value={`${(analysis.max_drawdown * 100).toFixed(1)}%`}
                  valueColor="#FF3B30"
                />
                <MetricRow
                  label="TOTAL VALUE"
                  value={`$${(analysis.total_value / 1000).toFixed(0)}K`}
                />
              </>
            ) : (
              <div className="text-[11px]" style={{ color: '#444444' }}>NO DATA</div>
            )}
          </div>

          {/* Allocation text bars */}
          <SectionHeader>Allocation</SectionHeader>
          <div className="px-3 py-2.5 flex-1">
            {alloc.length === 0 ? (
              <div className="text-[11px]" style={{ color: '#444444' }}>
                {loading ? 'LOADING...' : 'NO DATA'}
              </div>
            ) : (
              alloc.map(([name, value]) => {
                const pct = Math.round(value * 100)
                const filled = Math.round((pct / 100) * 10)
                const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
                return (
                  <div key={name} className="mb-2.5">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span style={{ color: '#888888' }}>
                        {name.toUpperCase().slice(0, 14)}
                      </span>
                      <span style={{ color: '#FFFFFF' }}>{pct}%</span>
                    </div>
                    <div className="text-[11px] tracking-tight" style={{ color: '#FF9900' }}>
                      {bar}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">

          {/* Performance chart */}
          <div
            className="shrink-0 flex flex-col"
            style={{ height: '200px', borderBottom: '1px solid #1E1E1E' }}
          >
            <SectionHeader>Performance</SectionHeader>
            <div className="flex-1 min-h-0">
              <PerformanceChart data={performanceHistory} />
            </div>
          </div>

          {/* Bottom split: sector + holdings */}
          <div className="flex flex-1 min-h-0">

            {/* Sector exposure */}
            <div
              className="shrink-0 flex flex-col overflow-hidden"
              style={{ width: '38%', borderRight: '1px solid #1E1E1E' }}
            >
              <SectionHeader>Sector Exposure</SectionHeader>
              <div className="flex-1 overflow-hidden">
                <SectorChart data={analysis?.sector_breakdown} />
              </div>
            </div>

            {/* Holdings table */}
            <div className="flex-1 flex flex-col min-w-0">
              <SectionHeader>Holdings</SectionHeader>
              <div className="flex-1 overflow-y-auto">
                <HoldingsTable
                  holdings={displayHoldings}
                  enhanced={holdingsDetail.length > 0}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Console bar + chat overlay */}
      <ChatBar client={selectedClient} portfolioData={portfolioData} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111111',
            border: '1px solid #1E1E1E',
            color: '#FFFFFF',
            fontFamily: 'monospace',
            borderRadius: 0,
            fontSize: '12px',
          },
        }}
      />
    </div>
  )
}
