export default function PersonaPills({ clients = [], selectedClient, onSelectClient, loading }) {
  if (loading) {
    return (
      <div className="flex items-center h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center h-full px-4 text-[11px] font-mono"
            style={{ borderRight: '1px solid #1E1E1E', color: '#333333' }}
          >
            F{i}: ——
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center h-full">
      {clients.map((client, i) => {
        const isActive = client.id === selectedClient?.id
        return (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelectClient(client)}
            className="flex items-center h-full px-4 text-[11px] font-mono"
            style={{
              borderRadius: 0,
              borderRight: '1px solid #1E1E1E',
              background: isActive ? 'rgba(255,153,0,0.08)' : 'transparent',
              color: isActive ? '#FF9900' : '#888888',
              borderBottom: isActive ? '2px solid #FF9900' : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = '#CC7A00'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = '#888888'
            }}
          >
            <span style={{ color: isActive ? '#CC7A00' : '#444444' }}>F{i + 1}:</span>
            <span className="ml-1">{client.name.split(' ')[0].toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
