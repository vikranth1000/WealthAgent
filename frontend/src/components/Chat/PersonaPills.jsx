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
    <div className="flex items-center gap-3 px-5 py-3 shrink-0 border-b border-white/[0.06]">
      {/* Wordmark */}
      <div className="flex items-center gap-2 shrink-0 mr-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.08]">
          <Sparkles size={13} className="text-slate-400" />
        </div>
        <span className="font-display text-sm font-semibold text-slate-400 tracking-tight">
          WealthAgent
        </span>
      </div>

      <div className="h-4 w-px bg-white/[0.08] shrink-0" />

      {/* Client pills */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-white/[0.05] animate-pulse shrink-0" />
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
                className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 whitespace-nowrap font-sans z-0"
                style={{ color: isActive ? 'var(--persona-primary)' : undefined }}
              >
                {/* Sliding background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'color-mix(in srgb, var(--persona-primary) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--persona-primary) 35%, transparent)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  size={11}
                  className={isActive ? '' : 'text-slate-500 opacity-60'}
                />
                <span className={isActive ? '' : 'text-slate-500 opacity-70'}>
                  {firstName}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
