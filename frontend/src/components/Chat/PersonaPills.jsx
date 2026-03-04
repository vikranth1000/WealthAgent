import { motion } from 'framer-motion'
import { Shield, TrendingUp, Briefcase, Building2, Sparkles } from 'lucide-react'

const PERSONA_META = {
  conservative_retiree: { label: 'Conservative', icon: Shield },
  aggressive_growth: { label: 'Aggressive', icon: TrendingUp },
  young_professional: { label: 'Young Pro', icon: Briefcase },
  institutional: { label: 'Institutional', icon: Building2 },
}

export default function PersonaPills({ clients, selectedClient, onSelectClient, loading }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 shrink-0">
      {/* Wordmark */}
      <div className="flex items-center gap-2 shrink-0 mr-1">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'color-mix(in srgb, var(--persona-primary) 12%, white)' }}
        >
          <Sparkles size={13} style={{ color: 'var(--persona-primary)' }} />
        </div>
        <span className="text-[15px] font-semibold" style={{ color: '#1c1c1e' }}>
          WealthAgent
        </span>
      </div>

      <div className="h-4 w-px shrink-0" style={{ background: 'rgba(0,0,0,0.10)' }} />

      {/* Client pills */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-black/[0.06] animate-pulse shrink-0" />
            ))}
          </>
        ) : (
          clients.map((client) => {
            const meta = PERSONA_META[client.persona] ?? { label: client.name, icon: Building2 }
            const Icon = meta.icon
            const isActive = selectedClient?.id === client.id
            const firstName = client.name.split(' ')[0]

            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 whitespace-nowrap z-0"
                style={{ color: isActive ? 'var(--persona-primary)' : '#6e6e73' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'color-mix(in srgb, var(--persona-primary) 12%, white)',
                      border: '1px solid color-mix(in srgb, var(--persona-primary) 30%, transparent)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={11} style={{ color: isActive ? 'var(--persona-primary)' : '#6e6e73', opacity: isActive ? 1 : 0.7 }} />
                <span style={{ opacity: isActive ? 1 : 0.8 }}>{firstName}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
