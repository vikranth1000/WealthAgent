import { Send } from 'lucide-react'

// Controlled chat input bar
// Props: value, onChange, onSubmit, disabled, placeholder
export default function ChatInput({ value, onChange, onSubmit, disabled, placeholder }) {
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={placeholder ?? 'Ask WealthAgent…'}
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal bg-light-gray disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value?.trim()}
        className="p-2 rounded-lg bg-teal text-white disabled:opacity-50 hover:bg-teal/90 transition-colors"
      >
        <Send size={16} />
      </button>
    </div>
  )
}
