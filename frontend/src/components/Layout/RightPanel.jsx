import { X, BarChart2, PieChart, TrendingUp, Table } from 'lucide-react'

function PlaceholderChart({ icon: Icon, label, height = 'h-32' }) {
  return (
    <div className={`${height} flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400`}>
      <Icon size={22} className="mb-1.5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-bold text-navy mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function RightPanel({ client, isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <aside className="w-80 shrink-0 flex flex-col bg-light-gray border-l border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-navy">Portfolio Dashboard</h2>
          {client && (
            <p className="text-xs text-gray-500 mt-0.5">{client.name}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Total Value"
            value={client?.totalValue ?? '—'}
            sub="As of today"
          />
          <MetricCard label="YTD Return" value="—" sub="Loading…" />
          <MetricCard label="Sharpe Ratio" value="—" sub="12-month" />
          <MetricCard label="Max Drawdown" value="—" sub="12-month" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Asset Allocation
          </h3>
          <PlaceholderChart icon={PieChart} label="Donut chart — current vs. target" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Performance
          </h3>
          <PlaceholderChart icon={TrendingUp} label="Line chart — portfolio vs. benchmark" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Sector Exposure
          </h3>
          <PlaceholderChart icon={BarChart2} label="Bar chart — sector breakdown" height="h-24" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Holdings
          </h3>
          <PlaceholderChart icon={Table} label="Sortable holdings table" height="h-24" />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-gray-200 bg-white shrink-0">
        <p className="text-xs text-gray-400 text-center">
          Charts powered by Recharts · Data from yfinance
        </p>
      </div>
    </aside>
  )
}
