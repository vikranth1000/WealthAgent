import { ArrowRightLeft, Scissors, BarChart3, FileText } from 'lucide-react'

const ACTIONS = [
  { id: 'rebalance', label: 'Rebalance', icon: ArrowRightLeft },
  { id: 'tax-loss', label: 'Tax Harvest', icon: Scissors },
  { id: 'stress-test', label: 'Stress Test', icon: BarChart3 },
  { id: 'report', label: 'Full Report', icon: FileText },
]

export default function ActionToolbar({ activeAction, onAction, disabled }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2">
      <span className="mr-0.5 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        AI Actions
      </span>
      <div className="h-3.5 w-px bg-slate-200 shrink-0" />
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onAction(id)}
          disabled={disabled}
          className={`shrink-0 rounded-md border px-3 py-1 text-xs font-medium transition-all ${
            activeAction === id
              ? 'border-teal/40 bg-teal/10 text-teal shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-100'
          } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer active:scale-95'}`}
        >
          <span className="flex items-center gap-1.5">
            <Icon size={12} />
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
