import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Layout/Sidebar.jsx'
import Header from './components/Layout/Header.jsx'
import RightPanel from './components/Layout/RightPanel.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'
import { useClients } from './hooks/useClients.js'
import { usePortfolio } from './hooks/usePortfolio.js'

const MIN_RIGHT_PANEL_WIDTH = 260
const MAX_RIGHT_PANEL_WIDTH = 540

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function App() {
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState(null)
  const portfolioData = usePortfolio(selectedClient?.id)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)
  const resizeStateRef = useRef(null)

  const handleResize = useCallback((event) => {
    if (!resizeStateRef.current) return
    const { startX, startWidth } = resizeStateRef.current
    const delta = event.clientX - startX
    setRightPanelWidth(clamp(startWidth - delta, MIN_RIGHT_PANEL_WIDTH, MAX_RIGHT_PANEL_WIDTH))
  }, [])

  const stopResizing = useCallback(() => {
    resizeStateRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', handleResize)
    window.removeEventListener('mouseup', stopResizing)
  }, [handleResize])

  const startResizing = useCallback(
    (event) => {
      resizeStateRef.current = { startX: event.clientX, startWidth: rightPanelWidth }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', stopResizing)
    },
    [handleResize, rightPanelWidth, stopResizing],
  )

  useEffect(() => {
    return () => stopResizing()
  }, [stopResizing])

  // Select first client once loaded
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients, selectedClient])

  // Update selectedClient when clients refresh (e.g. totalValue changes)
  useEffect(() => {
    if (selectedClient && clients.length > 0) {
      const updated = clients.find((c) => c.id === selectedClient.id)
      if (updated && updated.totalValue !== selectedClient.totalValue) {
        setSelectedClient(updated)
      }
    }
  }, [clients, selectedClient])

  return (
    <div className="flex flex-col h-screen bg-light-gray font-sans overflow-hidden">
      <Header
        client={selectedClient}
        rightPanelOpen={rightPanelOpen}
        onTogglePanel={() => setRightPanelOpen((o) => !o)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          loading={clientsLoading}
          collapsed={sidebarCollapsed}
          onExpand={() => setSidebarCollapsed(false)}
          onCollapse={() => setSidebarCollapsed(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden bg-white border-x border-gray-200">
          {selectedClient ? (
            <ChatWindow client={selectedClient} portfolioData={portfolioData} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              {clientsLoading ? 'Loading clients...' : 'Select a client to begin'}
            </div>
          )}
        </main>
        {selectedClient && (
          <RightPanel
            client={selectedClient}
            portfolioData={portfolioData}
            isOpen={rightPanelOpen}
            onClose={() => setRightPanelOpen(false)}
            width={rightPanelWidth}
            onResizeStart={startResizing}
          />
        )}
      </div>
    </div>
  )
}
