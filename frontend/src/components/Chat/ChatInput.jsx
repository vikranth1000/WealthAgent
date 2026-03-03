import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Square } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder }) {
  const [focused, setFocused] = useState(false)

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) {
        onStop?.()
      } else {
        onSubmit?.()
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Magic border wrapper activates on focus */}
      <div className={`flex-1 magic-card ${focused ? 'magic-card--active' : ''}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled && !isGenerating}
          placeholder={placeholder ?? 'Ask WealthAgent\u2026'}
          className="magic-card-inner w-full h-11 px-4 text-sm text-slate-200 placeholder-slate-600 outline-none font-sans bg-transparent"
        />
      </div>

      {isGenerating ? (
        <motion.button
          onClick={onStop}
          whileTap={{ scale: 0.92 }}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border border-rose-500/40 bg-rose-500/[0.10] text-rose-400 hover:bg-rose-500/[0.16] transition-all"
          title="Stop generating"
        >
          <Square size={14} className="fill-current" />
        </motion.button>
      ) : (
        <motion.button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{
            background: 'var(--persona-primary)',
            boxShadow: value?.trim() ? '0 0 18px color-mix(in srgb, var(--persona-primary) 50%, transparent)' : 'none',
          }}
          title="Send message"
        >
          <ArrowUp size={16} className="text-white" />
        </motion.button>
      )}
    </div>
  )
}
