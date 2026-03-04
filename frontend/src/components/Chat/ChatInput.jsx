import { Square, ArrowUp } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder }) {
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) onStop?.()
      else onSubmit?.()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] shrink-0 font-mono" style={{ color: '#FF9900' }}>{'>'}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled && !isGenerating}
        placeholder={placeholder ?? 'Enter command...'}
        autoFocus
        className="flex-1 bg-transparent outline-none text-[13px] font-mono"
        style={{ color: '#FFFFFF' }}
      />
      {isGenerating ? (
        <button
          onClick={onStop}
          className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-mono transition-colors"
          style={{ border: '1px solid #FF3B30', color: '#FF3B30', background: 'transparent' }}
          title="Stop"
        >
          <Square size={10} className="fill-current" />
          STOP
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-mono transition-colors disabled:opacity-30"
          style={{ border: '1px solid #FF9900', color: '#FF9900', background: 'transparent' }}
          title="Send"
        >
          <ArrowUp size={10} />
          SEND
        </button>
      )}
    </div>
  )
}
