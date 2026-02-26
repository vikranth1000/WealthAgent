import { Info, AlertTriangle, CheckCircle } from 'lucide-react'

const STYLES = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
  },
}

export default function InlineCallout({ data }) {
  if (!data?.text) return null

  const scheme = STYLES[data.style] || STYLES.info
  const Icon = scheme.icon

  return (
    <div className={`my-2 flex gap-2.5 rounded-xl border px-3.5 py-2.5 ${scheme.bg} ${scheme.border}`}>
      <Icon size={15} className={`shrink-0 mt-0.5 ${scheme.iconColor}`} />
      <div className="min-w-0">
        {data.title && (
          <p className={`text-xs font-semibold ${scheme.title}`}>{data.title}</p>
        )}
        <p className={`text-xs leading-relaxed ${scheme.text}`}>{data.text}</p>
      </div>
    </div>
  )
}
