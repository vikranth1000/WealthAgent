import { motion } from 'framer-motion'
import { X, Bot } from 'lucide-react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatDrawer({ client, portfolioData, onClose }) {
  return (
    <>
      {/* Dimmed backdrop purely for focus, though layout handles click-through otherwise */}
      <motion.div
        className="fixed inset-0 bg-background/50 backdrop-blur-[2px] z-40 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide-Up Bottom Workspace */}
      <motion.div
        className="fixed bottom-0 left-[5%] right-[5%] w-[90%] max-w-6xl mx-auto h-[75vh] bg-panel border-t border-l border-r border-border shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50 flex flex-col rounded-t-2xl overflow-hidden backdrop-blur-3xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-border/50 bg-background/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <span className="font-display font-semibold text-sm tracking-wide text-white block">
                WealthAgent Workspace
              </span>
              {client && (
                <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                  Analyzing {client.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors p-2 rounded-md hover:bg-white/10 flex items-center gap-2 text-xs font-medium"
          >
            Close <X size={14} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 min-h-0 flex flex-col bg-background/20 relative">
          {client ? (
            <ChatWindow
              client={client}
              portfolioData={portfolioData}
              onGeneratingChange={() => {}}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-muted text-center px-8">
              Select a client from the dashboard to initialize the AI workspace.
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
