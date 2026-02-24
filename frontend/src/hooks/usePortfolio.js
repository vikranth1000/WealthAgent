import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api.js'

// Module-level cache: clientId -> { portfolio, analysis, performanceHistory, holdingsDetail, timestamp }
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(clientId) {
  const entry = cache.get(clientId)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(clientId)
    return null
  }
  return entry
}

function setCache(clientId, data) {
  cache.set(clientId, { ...data, timestamp: Date.now() })
}

// Pre-seed partial cache (analysis only) from useClients so the first client
// selection can skip the redundant /analysis call
export function seedAnalysisCache(clientId, analysisData) {
  const existing = cache.get(clientId)
  if (existing) {
    existing.analysis = analysisData
    existing.timestamp = Date.now()
  } else {
    cache.set(clientId, {
      portfolio: null,
      analysis: analysisData,
      performanceHistory: [],
      holdingsDetail: [],
      timestamp: Date.now(),
    })
  }
}

/**
 * Prefetch and cache portfolio data for a client without updating React state.
 * Call this for background warming of the cache.
 */
export async function prefetchPortfolio(clientId) {
  if (!clientId) return
  // Already have a complete cache entry — skip
  const existing = getCached(clientId)
  if (existing && existing.portfolio !== null) return

  try {
    const [p, a, perfHistory, hDetail] = await Promise.all([
      api.getPortfolio(clientId),
      api.getAnalysis(clientId),
      api.getPerformanceHistory(clientId).catch(() => ({ history: [] })),
      api.getHoldingsDetail(clientId).catch(() => []),
    ])
    const perf = perfHistory.history ?? []
    setCache(clientId, { portfolio: p, analysis: a, performanceHistory: perf, holdingsDetail: hDetail })
  } catch {
    // Prefetch is best-effort — swallow errors
  }
}

export function usePortfolio(clientId) {
  const [portfolio, setPortfolio] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [holdingsDetail, setHoldingsDetail] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const applyData = useCallback((p, a, perf, holdings) => {
    setPortfolio(p)
    setAnalysis(a)
    setPerformanceHistory(perf)
    setHoldingsDetail(holdings)
  }, [])

  const fetchData = useCallback(async (id, signal) => {
    const [p, a, perfHistory, hDetail] = await Promise.all([
      api.getPortfolio(id),
      api.getAnalysis(id),
      api.getPerformanceHistory(id).catch(() => ({ history: [] })),
      api.getHoldingsDetail(id).catch(() => []),
    ])

    if (signal?.aborted) return null

    const perf = perfHistory.history ?? []
    const result = { portfolio: p, analysis: a, performanceHistory: perf, holdingsDetail: hDetail }
    setCache(id, result)
    return result
  }, [])

  useEffect(() => {
    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (!clientId) {
      applyData(null, null, [], [])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    // Check cache first
    const cached = getCached(clientId)
    const isComplete = cached && cached.portfolio !== null

    if (cached) {
      applyData(cached.portfolio, cached.analysis, cached.performanceHistory, cached.holdingsDetail)
    }

    if (isComplete) {
      // Full cache hit — show data, no loading state
      setLoading(false)
      setError(null)

      // Background refresh if cache is older than 1 minute
      if (Date.now() - cached.timestamp > 60 * 1000) {
        fetchData(clientId, controller.signal)
          .then((result) => {
            if (result && !controller.signal.aborted) {
              applyData(result.portfolio, result.analysis, result.performanceHistory, result.holdingsDetail)
            }
          })
          .catch(() => {})
      }
      return
    }

    // No complete cache — full fetch with loading state
    setLoading(true)
    setError(null)

    fetchData(clientId, controller.signal)
      .then((result) => {
        if (result && !controller.signal.aborted) {
          applyData(result.portfolio, result.analysis, result.performanceHistory, result.holdingsDetail)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [clientId, applyData, fetchData])

  const refresh = useCallback(() => {
    if (!clientId) return
    cache.delete(clientId)
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    fetchData(clientId, controller.signal)
      .then((result) => {
        if (result && !controller.signal.aborted) {
          applyData(result.portfolio, result.analysis, result.performanceHistory, result.holdingsDetail)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message)
          setLoading(false)
        }
      })
  }, [clientId, applyData, fetchData])

  return { portfolio, analysis, performanceHistory, holdingsDetail, loading, error, refresh }
}
