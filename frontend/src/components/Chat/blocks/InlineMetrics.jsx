import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLOR_MAP = {
  green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: TrendingUp },
  red: { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: TrendingDown },
  neutral: { text: 'text-navy', bg: 'bg-gray-50', border: 'border-gray-200', icon: Minus },
}

export default function InlineMetrics({ data }) {
  if (!data?.items?.length) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2">
      {data.items.map((item, i) => {
        const scheme = COLOR_MAP[item.color] || COLOR_MAP.neutral
        const Icon = scheme.icon
        return (
          <div
            key={i}
            className={`rounded-xl border px-3 py-2 ${scheme.bg} ${scheme.border}`}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={11} className={scheme.text} />
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                {item.label}
              </p>
            </div>
            <p className={`text-sm font-bold mt-0.5 tabular-nums ${scheme.text}`}>
              {item.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
