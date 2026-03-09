import { Square, ArrowRight, Plus } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder, onActionClick }) {
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) onStop?.()
      else onSubmit?.()
    }
  }

  return (
    <div className="flex items-center gap-3 bg-[#141414] border border-white/5 px-3 py-2.5 rounded-full md:mx-4 lg:mx-8 focus-within:border-white/20 transition-colors shadow-lg">
      <button
        onClick={onActionClick}
        disabled={disabled || isGenerating}
        className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-30"
        title="Actions"
      >
        <Plus size={16} strokeWidth={2} />
      </button>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled && !isGenerating}
        placeholder={placeholder ?? 'Ask anything...'}
        autoFocus
        className="flex-1 bg-transparent outline-none text-[15px] font-medium text-white placeholder:text-muted"
      />
      
      {isGenerating ? (
        <button
          onClick={onStop}
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="Stop Generating"
        >
          <Square size={14} className="fill-current" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white text-black hover:bg-white/80 transition-colors disabled:opacity-30"
          title="Send Message"
        >
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

