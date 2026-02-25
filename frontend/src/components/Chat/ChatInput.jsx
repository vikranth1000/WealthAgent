import { Send, Square } from 'lucide-react'

// Controlled chat input bar with send/stop toggle
// Props: value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder
export default function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder }) {
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
        disabled={disabled && !isGenerating}
        placeholder={placeholder ?? 'Ask WealthAgent\u2026'}
        className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-700 outline-none transition-all shadow-sm placeholder:text-gray-400 focus:border-teal/50 focus:bg-white focus:ring-2 focus:ring-teal/15 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      />
      {isGenerating ? (
        <button
          onClick={onStop}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
          title="Stop generating"
        >
          <Square size={14} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
          title="Send message"
        >
          <Send size={15} />
        </button>
      )}
    </div>
  )
}
