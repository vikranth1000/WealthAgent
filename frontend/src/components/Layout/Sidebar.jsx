import { useEffect, useRef } from 'react'
import { TrendingUp, Shield, Briefcase, Building2, Users } from 'lucide-react'

const PERSONA_META = {
  conservative_retiree: {
    icon: Shield,
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-500',
    selectedBg: 'bg-blue-50',
  },
  aggressive_growth: {
    icon: TrendingUp,
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-500',
    selectedBg: 'bg-orange-50',
  },
  young_professional: {
    icon: Briefcase,
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-500',
    selectedBg: 'bg-purple-50',
  },
  institutional: {
    icon: Building2,
    badge: 'bg-teal-100 text-teal-700',
    border: 'border-teal-500',
    selectedBg: 'bg-teal-50',
  },
}

function RiskBar({ value }) {
  const filled = Math.round(value)
  return (
    <div className="flex gap-[3px] mt-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < filled ? 'bg-teal' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

function ClientCard({ client, isSelected, onClick }) {
  const meta = PERSONA_META[client.persona]
  const Icon = meta.icon

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
        isSelected
          ? `border-l-[5px] ${meta.border} bg-white shadow-md ring-1 ring-gray-100`
          : 'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-xl text-white text-xs font-semibold shrink-0 ${client.avatarColor}`}
        >
          {client.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 truncate">{client.name}</p>
          <p className="text-[11px] text-gray-500 truncate">{client.occupation}</p>
          <span
            className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${meta.badge}`}
          >
            <Icon size={10} />
            {client.personaLabel}
          </span>
        </div>
      </div>

      <div className="mt-2.5 border-t border-gray-100 pt-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-gray-500">Portfolio Value</span>
          <span className="text-[11px] font-semibold text-gray-800">
            {client.totalValue ?? '...'}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[11px] text-gray-500">Risk</span>
          <span className="text-[11px] text-gray-600">{client.riskTolerance}/10</span>
        </div>
        <RiskBar value={client.riskTolerance} />
      </div>
    </button>
  )
}

function CollapsedClient({ client, isSelected, onClick }) {
  const meta = PERSONA_META[client.persona]
  const firstName = client.name.split(' ')[0]

  return (
    <button
      onClick={onClick}
      title={`${client.name} — ${client.personaLabel}`}
      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-150 w-full ${
        isSelected
          ? `${meta.selectedBg} border ${meta.border}`
          : 'hover:bg-gray-100 border border-transparent'
      }`}
    >
      <div
        className={`flex items-center justify-center w-9 h-9 rounded-xl text-white text-[11px] font-semibold shrink-0 ${client.avatarColor}`}
      >
        {client.initials}
      </div>
      <span className={`text-[10px] leading-tight truncate max-w-full ${
        isSelected ? 'font-semibold text-gray-900' : 'text-gray-500'
      }`}>
        {firstName}
      </span>
    </button>
  )
}

export default function Sidebar({
  clients,
  selectedClient,
  onSelectClient,
  loading,
  width,
  collapsed,
  onExpand,
  onCollapse,
}) {
  const drawerRef = useRef(null)

  // Close drawer when clicking outside
  useEffect(() => {
    if (collapsed) return

    function handleClickOutside(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onCollapse()
      }
    }

    // Delay listener so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [collapsed, onCollapse])

  function handleClientClick(client) {
    onSelectClient(client)
    onCollapse()
  }

  return (
    <>
      {/* Collapsed rail -- always visible */}
      <aside className="relative shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden w-[72px] z-20">
        <button
          onClick={collapsed ? onExpand : onCollapse}
          className="flex items-center justify-center gap-1 px-2 pt-3.5 pb-2 text-gray-400 hover:text-gray-600 transition-colors"
          title={collapsed ? 'Open client list' : 'Close client list'}
        >
          <Users size={14} />
        </button>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-2">
                <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
                <div className="h-2 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ))
          ) : (
            clients.map((client) => (
              <CollapsedClient
                key={client.id}
                client={client}
                isSelected={selectedClient?.id === client.id}
                onClick={() => onSelectClient(client)}
              />
            ))
          )}
        </nav>
      </aside>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-30 transition-opacity duration-200 ${
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={onCollapse}
      />

      {/* Expanded drawer -- overlays content */}
      <div
        ref={drawerRef}
        className={`fixed top-14 left-[72px] bottom-0 w-[280px] bg-white border-r border-gray-200 shadow-2xl z-40 flex flex-col transition-transform duration-200 ease-out ${
          collapsed ? '-translate-x-[calc(100%+72px)]' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Clients
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full p-3 rounded-xl border border-gray-200 bg-white animate-pulse">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={selectedClient?.id === client.id}
                onClick={() => handleClientClick(client)}
              />
            ))
          )}
        </nav>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-[10px] text-gray-400 text-center">
            Persona selector &middot; WealthAgent v0.1
          </p>
        </div>
      </div>
    </>
  )
}
