import { motion } from 'framer-motion'

export default function PersonaPills({ clients = [], selectedClient, onSelectClient, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-24 bg-white/5 rounded-full animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 h-full bg-white/5 p-1 rounded-full border border-border/50">
      {clients.map((client) => {
        const isActive = client.id === selectedClient?.id
        return (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelectClient(client)}
            className={`relative flex items-center h-8 px-4 text-xs font-medium rounded-full transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-muted hover:text-white'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="persona-pillbg"
                className="absolute inset-0 bg-accent-gradient rounded-full shadow-glow"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{client.name.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}

