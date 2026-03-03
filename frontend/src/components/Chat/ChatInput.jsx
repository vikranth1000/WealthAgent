import { useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'

// Controlled chat input bar with send/stop toggle
// Props: value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled && !isGenerating}
        placeholder={placeholder ?? 'Ask WealthAgent\u2026'}
        className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.10] px-4 text-sm text-slate-200 placeholder-slate-600 outline-none font-sans transition-all"
        style={focused ? { boxShadow: '0 0 0 2px color-mix(in srgb, var(--persona-primary) 35%, transparent)', borderColor: 'color-mix(in srgb, var(--persona-primary) 40%, transparent)' } : {}}
      />
      {isGenerating ? (
        <button
          onClick={onStop}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border border-rose-500/40 bg-rose-500/[0.10] text-rose-400 hover:bg-rose-500/[0.16] transition-all active:scale-95"
          title="Stop generating"
        >
          <Square size={14} className="fill-current" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'var(--persona-primary)' }}
          title="Send message"
        >
          <ArrowUp size={16} className="text-white" />
        </button>
      )}
    </div>
  )
}
