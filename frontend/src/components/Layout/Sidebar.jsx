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
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-sm ${i < filled ? 'bg-teal' : 'bg-gray-200'}`}
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
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
        isSelected
          ? `border-l-4 ${meta.border} bg-white shadow-sm`
          : 'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-semibold shrink-0 ${client.avatarColor}`}
        >
          {client.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
          <p className="text-xs text-gray-500 truncate">{client.occupation}</p>
          <span
            className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${meta.badge}`}
          >
            <Icon size={10} />
            {client.personaLabel}
          </span>
        </div>
      </div>

      <div className="mt-2.5 border-t border-gray-100 pt-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-gray-500">Portfolio Value</span>
          <span className="text-xs font-semibold text-gray-800">{client.totalValue}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">Risk</span>
          <span className="text-xs text-gray-600">{client.riskTolerance}/10</span>
        </div>
        <RiskBar value={client.riskTolerance} />
      </div>
    </button>
  )
}

export default function Sidebar({ clients, selectedClient, onSelectClient }) {
  return (
    <aside className="w-64 shrink-0 flex flex-col bg-light-gray border-r border-gray-200 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Clients
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            isSelected={selectedClient?.id === client.id}
            onClick={() => onSelectClient(client)}
          />
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400 text-center">
          Persona selector · WealthAgent v0.1
        </p>
      </div>
    </aside>
  )
}
