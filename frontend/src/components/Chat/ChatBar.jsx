import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ArrowUp, X } from 'lucide-react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatBar({ client, portfolioData }) {
  const [open, setOpen] = useState(false)

  const placeholder = client
    ? `Ask AI about ${client.name.split(' ')[0]}'s portfolio…`
    : 'Ask AI about this portfolio…'

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Pill */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="pill"
            className="fixed bottom-6 left-6 right-6 z-50 flex items-center gap-3 px-5 cursor-pointer select-none"
            style={{
              height: '60px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.92)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
            }}
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.35 }}
            whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)' }}
          >
            <MessageCircle size={16} style={{ color: '#6e6e73', flexShrink: 0 }} />
            <span className="flex-1 text-[14px]" style={{ color: '#6e6e73' }}>
              {placeholder}
            </span>
            <motion.button
              className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
              style={{ background: 'var(--persona-primary)' }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => { e.stopPropagation(); setOpen(true) }}
            >
              <ArrowUp size={15} color="white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            className="fixed bottom-6 left-6 right-6 z-50 flex flex-col overflow-hidden"
            style={{
              height: '70vh',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.92)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            {/* Sheet header */}
            <div
              className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b"
              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={14} style={{ color: 'var(--persona-primary)' }} />
                <span className="text-[13px] font-semibold" style={{ color: '#1c1c1e' }}>
                  {client ? `AI Assistant — ${client.name.split(' ')[0]}` : 'AI Assistant'}
                </span>
              </div>
              <motion.button
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ background: 'rgba(0,0,0,0.06)' }}
                whileHover={{ background: 'rgba(0,0,0,0.10)' }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(false)}
              >
                <X size={13} style={{ color: '#6e6e73' }} />
              </motion.button>
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
                  className="flex h-full items-center justify-center text-[13px]"
                  style={{ color: '#6e6e73' }}
                >
                  Select a client to begin
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
