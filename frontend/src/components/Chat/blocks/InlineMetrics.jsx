import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLOR_MAP = {
  green: { text: 'text-emerald-400', icon: TrendingUp },
  red: { text: 'text-rose-400', icon: TrendingDown },
  neutral: { text: 'text-slate-500', icon: Minus },
}

export default function InlineMetrics({ data }) {
  if (!data?.items?.length) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
      {data.items.map((item, i) => {
        const scheme = COLOR_MAP[item.color] || COLOR_MAP.neutral
        const Icon = scheme.icon
        return (
          <div
            key={i}
            className="rounded-xl bg-black/20 border border-white/[0.08] px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5">
              <Icon size={12} className={scheme.text} />
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-sans mb-1">
                {item.label}
              </p>
            </div>
            <p className="font-mono text-sm font-semibold text-slate-200">
              {item.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
