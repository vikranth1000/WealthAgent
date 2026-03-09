import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, TrendingUp, Activity, PieChart, Layers, MessageSquareText } from 'lucide-react'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import PerformanceChart from './components/Dashboard/PerformanceChart.jsx'
import SectorChart from './components/Dashboard/SectorChart.jsx'
import HoldingsTable from './components/Dashboard/HoldingsTable.jsx'
import ChatDrawer from './components/Chat/ChatDrawer.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

function SectionHeader({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
      {Icon && <Icon size={16} className="text-secondary" />}
      <h2 className="font-display font-semibold text-sm tracking-wide text-white uppercase">
        {children}
      </h2>
    </div>
  )
}

function MetricRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-2.5 group">
      <span className="text-xs font-medium text-muted uppercase tracking-wider group-hover:text-white transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        <span 
          className="font-mono text-sm font-semibold" 
          style={{ color: valueColor ?? '#FFFFFF' }}
        >
          {value ?? '—'}
        </span>
      </div>
    </div>
  )
}

// Container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
}

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) setSelectedClient(clients[0])
  }, [clients, selectedClient])

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsChatOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [])

  const { portfolio, analysis, performanceHistory, holdingsDetail, loading } = portfolioData
  const displayHoldings = holdingsDetail.length > 0 ? holdingsDetail : portfolio?.holdings ?? []

  const alloc = analysis?.current_allocation
    ? Object.entries(analysis.current_allocation)
        .filter(([, v]) => v > 0.001)
        .sort((a, b) => b[1] - a[1])
    : []

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-white font-sans relative">
      
      {/* ── Main dashboard area ── */}
      <div 
        className="flex flex-col flex-1 h-full relative z-10"
      >
        {/* ── Top navbar ── */}
        <header className="shrink-0 flex items-center justify-between px-6 h-16 bg-panel/30 border-b border-border/50 sticky top-0 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <Shield size={18} className="text-black" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">
              WealthAgent
            </span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-6">
            <PersonaPills
              clients={clients}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClient}
              loading={clientsLoading}
            />
            <div className="w-px h-6 bg-border" />
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-sm font-medium text-muted hover:text-white"
            >
              <MessageSquareText size={16} />
              <span>{isChatOpen ? 'Close Chat' : 'Open Chat'}</span>
              <kbd className="hidden sm:inline-block border border-white/20 rounded px-1.5 py-0.5 text-[10px] ml-1">⌘K</kbd>
            </button>
          </div>
        </header>

        {/* ── Main content area ── */}
        <main className="flex flex-1 min-h-0 p-4 gap-4 overflow-hidden">
          
          {/* Left sidebar */}
          <motion.div 
            className="shrink-0 flex flex-col w-[300px] gap-4 overflow-y-auto no-scrollbar pb-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Portfolio Summary Card */}
            <motion.div variants={itemVariants} className="glass-card flex flex-col pt-2 pb-6 px-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-xs text-muted uppercase tracking-widest mt-4">Overview</h3>
                <Activity size={14} className="text-muted mt-4" />
              </div>
              
              <div className="mt-2 text-white">
                <h1 className="text-xl font-semibold tracking-tight">
                  {selectedClient?.name ?? '—'}
                </h1>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted mt-1 bg-white/5 inline-block px-2 py-0.5 rounded border border-white/10">
                  {selectedClient?.persona?.replace(/_/g, ' ') ?? ''}
                </div>
              </div>

              <div className="mt-8 flex flex-col">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Value</span>
                <div className="text-3xl font-display font-bold text-white mt-1">
                  {loading
                    ? '———'
                    : analysis
                    ? `$${Math.round(analysis.total_value).toLocaleString()}`
                    : '—'}
                </div>
                {analysis && (
                  <div className={`text-xs font-medium mt-2 flex items-center gap-1 ${analysis.total_return >= 0 ? 'text-success' : 'text-danger'}`}>
                    {analysis.total_return >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                    {analysis.total_return >= 0 ? '+' : ''}
                    {(analysis.total_return * 100).toFixed(1)}% YTD
                  </div>
                )}
              </div>
            </motion.div>

            {/* Key Metrics Card */}
            <motion.div variants={itemVariants} className="glass-card flex flex-col flex-1 min-h-[200px]">
              <SectionHeader icon={Activity}>Key Metrics</SectionHeader>
              <div className="px-5 py-3 flex flex-col divide-y divide-border/30">
                {loading ? (
                  <div className="flex items-center justify-center p-8 text-sm text-muted animate-pulse">Loading data...</div>
                ) : analysis ? (
                  <>
                    <MetricRow
                      label="YTD Return"
                      value={`${analysis.total_return >= 0 ? '+' : ''}${(analysis.total_return * 100).toFixed(1)}%`}
                      valueColor={analysis.total_return >= 0 ? '#10b981' : '#ef4444'}
                    />
                    <MetricRow
                      label="Sharpe Ratio"
                      value={analysis.sharpe_ratio?.toFixed(2)}
                      valueColor="#FAFAFA"
                    />
                    <MetricRow
                      label="Max Drawdown"
                      value={`${(analysis.max_drawdown * 100).toFixed(1)}%`}
                      valueColor="#ef4444"
                    />
                    <MetricRow
                      label="Total Value"
                      value={`$${(analysis.total_value / 1000).toFixed(0)}K`}
                      valueColor="#FAFAFA"
                    />
                  </>
                ) : (
                  <div className="text-sm text-muted p-4 text-center">No metrics available</div>
                )}
              </div>
            </motion.div>

            {/* Asset Allocation Card */}
            <motion.div variants={itemVariants} className="glass-card flex flex-col">
              <SectionHeader icon={PieChart}>Asset Allocation</SectionHeader>
              <div className="px-5 py-5 flex flex-col gap-4">
                {alloc.length === 0 ? (
                  <div className="text-sm text-muted text-center p-4">
                    {loading ? 'Loading...' : 'No allocation data'}
                  </div>
                ) : (
                  alloc.map(([name, value], i) => {
                    const pct = Math.round(value * 100)
                    return (
                      <div key={name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-muted tracking-wide uppercase">{name}</span>
                          <span className="text-white font-mono">{pct}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                            className="h-full bg-white rounded-full"
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content Area */}
          <motion.div 
            className="flex-1 flex flex-col gap-4 min-w-0"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Performance Chart Card */}
            <motion.div variants={itemVariants} className="glass-card shrink-0 flex flex-col h-[320px]">
              <SectionHeader icon={TrendingUp}>Performance History</SectionHeader>
              <div className="flex-1 p-4 min-h-0 relative">
                <PerformanceChart data={performanceHistory} />
              </div>
            </motion.div>

            {/* Bottom Split: Sector + Holdings */}
            <motion.div variants={itemVariants} className="flex gap-4 flex-1 min-h-0 pb-8">
              
              {/* Sector Exposure Card */}
              <div className="glass-card flex flex-col w-[38%] min-h-0">
                <SectionHeader icon={PieChart}>Sector Exposure</SectionHeader>
                <div className="flex-1 p-4 overflow-hidden relative">
                  <SectorChart data={analysis?.sector_breakdown} />
                </div>
              </div>

              {/* Holdings Table Card */}
              <div className="glass-card flex flex-col flex-1 min-w-0 min-h-0">
                <SectionHeader icon={Layers}>Portfolio Holdings</SectionHeader>
                <div className="flex-1 overflow-hidden">
                  <HoldingsTable
                    holdings={displayHoldings}
                    enhanced={holdingsDetail.length > 0}
                  />
                </div>
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>

      {/* ── Slide-in Chat Drawer ── */}
      <AnimatePresence>
        {isChatOpen && (
          <ChatDrawer 
            client={selectedClient} 
            portfolioData={portfolioData} 
            onClose={() => setIsChatOpen(false)} 
          />
        )}
      </AnimatePresence>

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-card border-l-2 border-l-white !bg-panel !text-white !rounded-lg !shadow-subtle',
          style: { fontFamily: 'Inter, sans-serif' },
        }}
      />
    </div>
  )
}

