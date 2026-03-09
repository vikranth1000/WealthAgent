const LABELS = {
  metrics: 'Loading metrics...',
  allocation: 'Loading chart...',
  'bar-chart': 'Loading chart...',
  table: 'Loading table...',
  callout: 'Loading...',
}

export default function BlockSkeleton({ blockType }) {
  return (
    <div className="my-2 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 h-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/[0.06] animate-pulse rounded-xl" />
      <span className="relative text-xs text-slate-700 font-sans">{LABELS[blockType] || 'Loading...'}</span>
    </div>
  )
}
