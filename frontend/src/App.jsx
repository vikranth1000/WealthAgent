import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import HeroCard from './components/Dashboard/HeroCard.jsx'
import MetricCards from './components/Dashboard/MetricCards.jsx'
import AllocationChart from './components/Dashboard/AllocationChart.jsx'
import PerformanceChart from './components/Dashboard/PerformanceChart.jsx'
import SectorChart from './components/Dashboard/SectorChart.jsx'
import HoldingsTable from './components/Dashboard/HoldingsTable.jsx'
import ChatBar from './components/Chat/ChatBar.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const PERSONA_COLORS = {
  conservative_retiree: '#0071E3',
  aggressive_growth: '#FF9500',
  young_professional: '#AF52DE',
  institutional: '#34C759',
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 28, delay: i * 0.06 },
  }),
}

function Section({ title, children }) {
  return (
    <div>
      {title && <p className="apple-label mb-3">{title}</p>}
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[20px] h-[148px] bg-white/50 animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[16px] bg-white/50 animate-pulse h-[68px]" />
          ))}
        </div>
      </div>
      {[192, 220, 180].map((h, i) => (
        <div key={i} className="rounded-[16px] bg-white/50 animate-pulse" style={{ height: h }} />
      ))}
    </div>
  )
}

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients, selectedClient])

  useEffect(() => {
    if (selectedClient && clients.length > 0) {
      const updated = clients.find((c) => c.id === selectedClient.id)
      if (updated && updated.totalValue !== selectedClient.totalValue) {
        setSelectedClient(updated)
      }
    }
  }, [clients, selectedClient])

  useEffect(() => {
    const color = PERSONA_COLORS[selectedClient?.persona] ?? '#0071E3'
    document.documentElement.style.setProperty('--persona-primary', color)
  }, [selectedClient?.persona])

  const { portfolio, analysis, performanceHistory, holdingsDetail, loading, error } = portfolioData

  const metrics = analysis
    ? {
        totalValue: analysis.total_value,
        ytdReturn: analysis.total_return,
        sharpe: analysis.sharpe_ratio,
        maxDrawdown: analysis.max_drawdown,
      }
    : {}

  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings ?? []

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col font-sans"
      style={{
        background: 'radial-gradient(ellipse at 20% 15%, #dde8ff 0%, #f0f4ff 45%, #eef0fa 100%)',
      }}
    >
      {/* Top bar */}
      <div
        className="shrink-0 z-30 relative apple-glass-secondary"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <PersonaPills
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
        />
      </div>

      {/* Scrollable bento canvas */}
      <main
        className="flex-1 overflow-y-auto relative z-10"
        style={{ paddingBottom: '96px' }}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div
            className="flex h-full items-center justify-center text-[13px]"
            style={{ color: '#6e6e73' }}
          >
            {error}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Row 1: Hero + Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <HeroCard client={selectedClient} analysis={analysis} />
              <MetricCards metrics={metrics} />
            </div>

            {/* Row 2: Performance chart (full width) */}
            <motion.div
              className="apple-glass-secondary rounded-[16px] p-5"
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              key={`${selectedClient?.id}-perf`}
            >
              <Section title="Performance">
                <PerformanceChart data={performanceHistory} />
              </Section>
            </motion.div>

            {/* Row 3: Allocation + Sector (50/50) */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="apple-glass-secondary rounded-[16px] p-5"
                custom={3}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                key={`${selectedClient?.id}-alloc`}
              >
                <Section title="Asset Allocation">
                  <AllocationChart data={analysis?.current_allocation} />
                </Section>
              </motion.div>
              <motion.div
                className="apple-glass-secondary rounded-[16px] p-5"
                custom={4}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                key={`${selectedClient?.id}-sector`}
              >
                <Section title="Sector Exposure">
                  <SectorChart data={analysis?.sector_breakdown} />
                </Section>
              </motion.div>
            </div>

            {/* Row 4: Holdings table (full width) */}
            <motion.div
              className="apple-glass-secondary rounded-[16px] p-5"
              custom={5}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              key={`${selectedClient?.id}-holdings`}
            >
              <Section title="Holdings">
                <HoldingsTable
                  holdings={displayHoldings}
                  enhanced={holdingsDetail.length > 0}
                />
              </Section>
            </motion.div>
          </div>
        )}
      </main>

      {/* Floating chat bar */}
      <ChatBar client={selectedClient} portfolioData={portfolioData} />

      <Toaster position="top-right" theme="light" />
    </div>
  )
}
