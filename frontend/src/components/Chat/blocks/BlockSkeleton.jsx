const LABELS = {
  metrics: 'Loading metrics...',
  allocation: 'Loading chart...',
  'bar-chart': 'Loading chart...',
  table: 'Loading table...',
  callout: 'Loading...',
}

export default function BlockSkeleton({ blockType }) {
  return (
    <div className="my-2 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 h-24 animate-pulse">
      <span className="text-xs text-gray-400">{LABELS[blockType] || 'Loading...'}</span>
    </div>
  )
}
