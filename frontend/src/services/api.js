const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  health: () => request('/health'),

  getClients: () => request('/clients'),

  getClient: (clientId) => request(`/clients/${clientId}`),

  getPortfolio: (clientId) => request(`/clients/${clientId}/portfolio`),

  getAnalysis: (clientId) => request(`/clients/${clientId}/analysis`),

  getChatHistory: (clientId) => request(`/clients/${clientId}/chat-history`),

  sendMessage: (payload) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  clearChatHistory: (clientId) =>
    request(`/clients/${clientId}/chat-history`, { method: 'DELETE' }),

  getRebalancing: (clientId) => request(`/clients/${clientId}/rebalancing`),

  getTaxLoss: (clientId) => request(`/clients/${clientId}/tax-loss`),

  getPerformanceHistory: (clientId) => request(`/clients/${clientId}/performance-history`),

  getHoldingsDetail: (clientId) => request(`/clients/${clientId}/holdings-detail`),
}
