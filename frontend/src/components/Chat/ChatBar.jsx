import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Command } from 'lucide-react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatBar({ client, portfolioData }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape' && open) setOpen(false)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [open])

  const placeholder = client
    ? `Ask WealthAgent about ${client.name.split(' ')[0]}...`
    : 'Select a client to begin...'

  return (
    <>
      {/* Dimmed backdrop when chat is open */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-50 flex flex-col glass-card border-primary/20 bg-background/80 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)]"
            style={{
              bottom: '90px',
              left: '50%',
              width: '800px',
              maxWidth: '90vw',
              height: '65vh',
              x: '-50%'
            }}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent-gradient flex items-center justify-center shadow-glow">
                  <Command size={12} className="text-white" />
                </div>
                <span className="font-display font-semibold text-sm tracking-wide text-white">
                  AGENT CONSOLE
                </span>
                {client && (
                  <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-full ml-2">
                    {client.name.split(' ')[0]}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 min-h-0 bg-panel/30 rounded-b-2xl overflow-hidden">
              {client ? (
                <ChatWindow
                  client={client}
                  portfolioData={portfolioData}
                  onGeneratingChange={() => {}}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-muted">
                  Please select a client to begin.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <motion.div 
          className="glass-card flex items-center gap-4 px-5 py-3 rounded-full w-full border-white/10 bg-background/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-primary/30 transition-colors cursor-text group"
          onClick={() => setOpen(true)}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.5, damping: 20 }}
        >
          {/* Status Indicator */}
          <div className="flex items-center justify-center relative w-8 h-8 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors shrink-0">
            <div className="absolute w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
          </div>

          {/* Input field fake */}
          <div className="flex-1 text-sm font-medium text-muted group-hover:text-white/80 transition-colors truncate">
            {placeholder}
          </div>

          {/* Shortcut icon */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-muted bg-white/5 px-2 py-1 rounded-md border border-white/10">
              <span>⌘</span><span>K</span>
            </div>
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-glow hover:scale-105 transition-transform">
              <MessageSquare size={14} className="fill-current" />
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

