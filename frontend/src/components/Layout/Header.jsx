import { LayoutDashboard, ChevronRight, ChevronLeft } from 'lucide-react'

const PERSONA_COLORS = {
  conservative_retiree: 'bg-blue-100 text-blue-800',
  aggressive_growth: 'bg-orange-100 text-orange-800',
  young_professional: 'bg-purple-100 text-purple-800',
  institutional: 'bg-teal-100 text-teal-800',
}

export default function Header({ client, rightPanelOpen, onTogglePanel }) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-navy text-white shrink-0 shadow-md z-10">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 bg-teal rounded">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <span className="font-semibold text-lg tracking-tight">WealthAgent</span>
        <span className="ml-1 text-gray-400 text-sm hidden sm:block">
          / AI Wealth Management
        </span>
      </div>

      {client && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-none">{client.name}</p>
            <p className="text-xs text-gray-300 mt-0.5">{client.occupation}</p>
          </div>
          <span
            className={`hidden md:inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${PERSONA_COLORS[client.persona]}`}
          >
            {client.personaLabel}
          </span>
        </div>
      )}

      <button
        onClick={onTogglePanel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-200 hover:bg-white/10 transition-colors"
        title={rightPanelOpen ? 'Hide dashboard' : 'Show dashboard'}
      >
        <LayoutDashboard size={15} />
        <span className="hidden sm:inline">Dashboard</span>
        {rightPanelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </header>
  )
}
