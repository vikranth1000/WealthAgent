import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

// Fetches portfolio, analysis, performance history, and holdings detail for a given clientId
// Returns: { portfolio, analysis, performanceHistory, holdingsDetail, loading, error, refresh }
export function usePortfolio(clientId) {
  const [portfolio, setPortfolio] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [holdingsDetail, setHoldingsDetail] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchData() {
    if (!clientId) return
    setLoading(true)
    setError(null)
    try {
      const [p, a, perfHistory, hDetail] = await Promise.all([
        api.getPortfolio(clientId),
        api.getAnalysis(clientId),
        api.getPerformanceHistory(clientId).catch(() => ({ history: [] })),
        api.getHoldingsDetail(clientId).catch(() => []),
      ])
      setPortfolio(p)
      setAnalysis(a)
      setPerformanceHistory(perfHistory.history ?? [])
      setHoldingsDetail(hDetail)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  return { portfolio, analysis, performanceHistory, holdingsDetail, loading, error, refresh: fetchData }
}
