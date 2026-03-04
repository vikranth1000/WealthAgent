import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatBar({ client, portfolioData }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [open])

  const placeholder = client
    ? `Ask about ${client.name.split(' ')[0]}'s portfolio...`
    : 'Select a client to begin...'

  return (
    <>
      {/* 2D flat chat panel — slides up from console bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="terminal-chat"
            className="fixed left-0 right-0 z-50 flex flex-col"
            style={{
              bottom: '42px',
              height: '60vh',
              background: '#111111',
              borderTop: '1px solid #FF9900',
              borderLeft: '1px solid #FF9900',
              borderRight: '1px solid #FF9900',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          >
            {/* Panel header */}
            <div
              className="shrink-0 flex items-center justify-between px-4"
              style={{ height: '32px', borderBottom: '1px solid #1E1E1E' }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: '#FF9900' }}
              >
                AI CONSOLE{client ? ` — ${client.name.split(' ')[0].toUpperCase()}` : ''}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] font-mono transition-colors"
                style={{ color: '#888888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FF9900')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                [X]
              </button>
            </div>

            {/* Chat window */}
            <div className="flex-1 min-h-0">
              {client ? (
                <ChatWindow
                  client={client}
                  portfolioData={portfolioData}
                  onGeneratingChange={() => {}}
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-[11px] font-mono"
                  style={{ color: '#444444' }}
                >
                  NO CLIENT SELECTED
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console bar — always visible */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 relative z-50"
        style={{
          height: '42px',
          background: '#111111',
          borderTop: `1px solid ${open ? '#FF9900' : '#1E1E1E'}`,
        }}
      >
        {/* Connection dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: '#00C805' }}
          />
          <span className="text-[10px] font-mono" style={{ color: '#444444' }}>
            READY
          </span>
        </div>

        {/* Prompt */}
        <span className="text-[13px] shrink-0 font-mono" style={{ color: '#FF9900' }}>
          {'>'}
        </span>

        {/* Input trigger */}
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[13px] font-mono cursor-pointer"
          style={{ color: '#444444' }}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
        />

        {/* Actions button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono transition-colors"
          style={{ border: '1px solid #1E1E1E', color: '#888888', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FF9900'
            e.currentTarget.style.color = '#FF9900'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1E1E1E'
            e.currentTarget.style.color = '#888888'
          }}
        >
          <Zap size={10} />
          CHAT
        </button>
      </div>
    </>
  )
}
