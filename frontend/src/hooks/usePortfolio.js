import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

// Fetches portfolio and analysis data for a given clientId
// Returns: { portfolio, analysis, loading, error, refresh }
export function usePortfolio(clientId) {
  const [portfolio, setPortfolio] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchData() {
    if (!clientId) return
    setLoading(true)
    setError(null)
    try {
      const [p, a] = await Promise.all([
        api.getPortfolio(clientId),
        api.getAnalysis(clientId),
      ])
      setPortfolio(p)
      setAnalysis(a)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  return { portfolio, analysis, loading, error, refresh: fetchData }
}
