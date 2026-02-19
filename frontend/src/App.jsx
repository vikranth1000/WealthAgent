import { useState } from 'react'
import Sidebar from './components/Layout/Sidebar.jsx'
import Header from './components/Layout/Header.jsx'
import RightPanel from './components/Layout/RightPanel.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

export const CLIENTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Margaret Chen',
    persona: 'conservative_retiree',
    personaLabel: 'Conservative Retiree',
    age: 68,
    occupation: 'Retired Teacher',
    riskTolerance: 2,
    totalValue: '$1,218,400',
    initials: 'MC',
    avatarColor: 'bg-blue-600',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Alex Rodriguez',
    persona: 'aggressive_growth',
    personaLabel: 'Aggressive Growth',
    age: 32,
    occupation: 'Startup Founder',
    riskTolerance: 9,
    totalValue: '$450,000',
    initials: 'AR',
    avatarColor: 'bg-orange-500',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Priya Sharma',
    persona: 'young_professional',
    personaLabel: 'Young Professional',
    age: 26,
    occupation: 'Data Scientist',
    riskTolerance: 6,
    totalValue: '$85,000',
    initials: 'PS',
    avatarColor: 'bg-purple-500',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Meridian Capital',
    persona: 'institutional',
    personaLabel: 'Institutional',
    occupation: 'Hedge Fund',
    riskTolerance: 7,
    totalValue: '$50,000,000',
    initials: 'MC',
    avatarColor: 'bg-teal',
  },
]

export default function App() {
  const [selectedClient, setSelectedClient] = useState(CLIENTS[0])
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  return (
    <div className="flex flex-col h-screen bg-light-gray font-sans overflow-hidden">
      <Header
        client={selectedClient}
        rightPanelOpen={rightPanelOpen}
        onTogglePanel={() => setRightPanelOpen((o) => !o)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          clients={CLIENTS}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
        />
        <main className="flex-1 flex flex-col overflow-hidden bg-white border-x border-gray-200">
          <ChatWindow client={selectedClient} />
        </main>
        <RightPanel
          client={selectedClient}
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </div>
    </div>
  )
}
