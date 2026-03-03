import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import RightPanel from './components/Layout/RightPanel.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const PERSONA_COLORS = {
  conservative_retiree: '#3B82F6',
  aggressive_growth: '#F59E0B',
  young_professional: '#A855F7',
  institutional: '#2DD4BF',
}

const spring = { type: 'spring', stiffness: 260, damping: 28 }

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)
  const [isGenerating, setIsGenerating] = useState(false)

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
    const color = PERSONA_COLORS[selectedClient?.persona] ?? '#3B82F6'
    document.documentElement.style.setProperty('--persona-primary', color)
  }, [selectedClient?.persona])

  const accentColor = PERSONA_COLORS[selectedClient?.persona] ?? '#3B82F6'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#05080F] font-sans">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full blur-3xl"
          animate={{ backgroundColor: accentColor, opacity: 0.04 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 -translate-y-1/2 h-80 w-80 rounded-full blur-3xl"
          animate={{ backgroundColor: accentColor, opacity: 0.03 }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.div
          className="absolute -bottom-40 right-16 h-72 w-72 rounded-full blur-3xl"
          animate={{ backgroundColor: accentColor, opacity: 0.04 }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
        />
      </div>

      {/* Left panel — Chat */}
      <motion.div
        className="relative z-10 flex w-[55%] flex-col h-full bg-[#05080F]/90"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={spring}
      >
        <PersonaPills
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
        />
        <div className="flex-1 min-h-0">
          {selectedClient ? (
            <ChatWindow
              client={selectedClient}
              portfolioData={portfolioData}
              onGeneratingChange={setIsGenerating}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600 text-sm">
              {clientsLoading ? 'Loading clients…' : 'Select a client to begin'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Glowing divider */}
      <motion.div
        className="relative z-10 w-px shrink-0"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        style={{ originY: 0 }}
      >
        <div
          className={`absolute inset-0 persona-divider transition-all duration-[1200ms] ${isGenerating ? 'animate-breathe' : ''}`}
        />
      </motion.div>

      {/* Right panel — Portfolio */}
      <motion.div
        className="relative z-10 flex w-[45%] flex-col h-full"
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...spring, delay: 0.15 }}
      >
        <RightPanel client={selectedClient} portfolioData={portfolioData} />
      </motion.div>

      <Toaster position="bottom-left" theme="dark" />
    </div>
  )
}
