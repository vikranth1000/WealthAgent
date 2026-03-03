import { useState, useEffect } from 'react'
import RightPanel from './components/Layout/RightPanel.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'
import PersonaPills from './components/Chat/PersonaPills.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const PERSONA_COLORS = {
  conservative_retiree: '#3B82F6',
  aggressive_growth: '#F59E0B',
  young_professional: '#8B5CF6',
  institutional: '#2DD4BF',
}

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A] font-sans">
      {/* Background gradient mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full blur-3xl opacity-[0.04] transition-all duration-[2000ms] ease-in-out"
          style={{ background: 'var(--persona-primary)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 -translate-y-1/2 h-80 w-80 rounded-full blur-3xl opacity-[0.03] transition-all duration-[2000ms] ease-in-out delay-300"
          style={{ background: 'var(--persona-primary)' }}
        />
        <div
          className="absolute -bottom-40 right-16 h-72 w-72 rounded-full blur-3xl opacity-[0.04] transition-all duration-[2000ms] ease-in-out delay-700"
          style={{ background: 'var(--persona-primary)' }}
        />
      </div>

      {/* Left panel — Chat */}
      <div className="relative z-10 flex w-[55%] flex-col h-full animate-panel-left bg-[#080D1A]/80">
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
      </div>

      {/* Glowing divider */}
      <div className="relative z-10 w-px shrink-0 animate-divider-draw">
        <div
          className={`absolute inset-0 persona-divider transition-all duration-[1200ms] ${isGenerating ? 'animate-breathe' : ''}`}
        />
      </div>

      {/* Right panel — Portfolio */}
      <div className="relative z-10 flex w-[45%] flex-col h-full animate-panel-right">
        <RightPanel client={selectedClient} portfolioData={portfolioData} />
      </div>
    </div>
  )
}
