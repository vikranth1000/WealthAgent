import { Info, AlertTriangle, CheckCircle } from 'lucide-react'

const STYLES = {
  info: {
    container: 'bg-blue-500/[0.08] border-l-blue-500/50',
    icon: Info,
    iconColor: 'text-blue-400',
    title: 'text-blue-400 font-semibold text-sm font-sans',
    text: 'text-blue-300/80 text-sm font-sans',
  },
  warning: {
    container: 'bg-amber-500/[0.08] border-l-amber-500/50',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    title: 'text-amber-400 font-semibold text-sm font-sans',
    text: 'text-amber-300/80 text-sm font-sans',
  },
  success: {
    container: 'bg-emerald-500/[0.08] border-l-emerald-500/50',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    title: 'text-emerald-400 font-semibold text-sm font-sans',
    text: 'text-emerald-300/80 text-sm font-sans',
  },
}

export default function InlineCallout({ data }) {
  if (!data?.text) return null

  const scheme = STYLES[data.style] || STYLES.info
  const Icon = scheme.icon

  return (
    <div className={`rounded-xl border-l-4 p-3 my-3 ${scheme.container}`}>
      <div className="flex gap-2.5">
        <Icon size={18} className={`shrink-0 mt-0.5 ${scheme.iconColor}`} />
        <div className="min-w-0">
          {data.title && (
            <p className={scheme.title}>{data.title}</p>
          )}
          <p className={`leading-relaxed ${scheme.text}`}>{data.text}</p>
        </div>
      </div>
    </div>
  )
}
