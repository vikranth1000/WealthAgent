import { ArrowRightLeft, Scissors, BarChart3, FileText } from 'lucide-react'

const ACTIONS = [
  { id: 'rebalance', label: 'Rebalance', icon: ArrowRightLeft },
  { id: 'tax-loss', label: 'Tax Harvest', icon: Scissors },
  { id: 'stress-test', label: 'Stress Test', icon: BarChart3 },
  { id: 'report', label: 'Full Report', icon: FileText },
]

export default function ActionToolbar({ activeAction, onAction, disabled }) {
  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2.5">
      <span className="mr-1 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
        AI Tools
      </span>
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onAction(id)}
          disabled={disabled}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            activeAction === id
              ? 'border-teal/40 bg-teal/10 text-teal shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer active:scale-95'}`}
        >
          <span className="flex items-center gap-1.5">
            <Icon size={13} />
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
