import { TrendingUp, Shield, Briefcase, Building2 } from 'lucide-react'

const PERSONA_META = {
  conservative_retiree: {
    icon: Shield,
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-500',
    ring: 'ring-blue-500',
  },
  aggressive_growth: {
    icon: TrendingUp,
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-500',
    ring: 'ring-orange-500',
  },
  young_professional: {
    icon: Briefcase,
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-500',
    ring: 'ring-purple-500',
  },
  institutional: {
    icon: Building2,
    badge: 'bg-teal-100 text-teal-700',
    border: 'border-teal-500',
    ring: 'ring-teal-500',
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
          <span className="text-[11px] font-semibold text-gray-800">{client.totalValue}</span>
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

export default function Sidebar({
  clients,
  selectedClient,
  onSelectClient,
  loading,
  width,
  onResizeStart,
}) {
  return (
    <aside
      className="relative shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden"
      style={{ width: `${width}px` }}
    >
      <div className="px-4 pt-4 pb-2">
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
              <div className="mt-2.5 border-t border-gray-100 pt-2 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded w-full" />
                <div className="h-1 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isSelected={selectedClient?.id === client.id}
              onClick={() => onSelectClient(client)}
            />
          ))
        )}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <p className="text-[10px] text-gray-400 text-center">
          Persona selector &middot; WealthAgent v0.1
        </p>
      </div>

      <div
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-teal/20 transition-colors"
        onMouseDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize clients panel"
      />
    </aside>
  )
}
