import { useState, useEffect, useCallback } from 'react'
import { api } from '../../services/api.js'
import RebalancingCard from './RebalancingCard.jsx'
import TaxLossCard from './TaxLossCard.jsx'
import StressTestCard from './StressTestCard.jsx'

// Renders as a floating overlay above the chat area (positioned absolute in a relative parent)
export default function ActionPanel({ action, clientId, analysis, onClose, onSendMessage }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!action || !clientId) return

    // Report action triggers a chat message instead
    if (action === 'report') {
      onSendMessage?.('Give me a comprehensive full portfolio review with market outlook')
      onClose()
      return
    }

    // Stress test uses frontend-only computation
    if (action === 'stress-test') {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)

    const fetcher = action === 'rebalance' ? api.getRebalancing : api.getTaxLoss

    fetcher(clientId)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [action, clientId])

  // When user clicks "Ask AI" on a card, send the prompt and close the panel
  const handleAskAI = useCallback((prompt) => {
    onSendMessage?.(prompt)
    onClose()
  }, [onSendMessage, onClose])

  if (!action || action === 'report') return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Floating panel */}
      <div className="absolute inset-x-4 top-4 z-30 max-h-[calc(100%-32px)] overflow-y-auto drop-shadow-xl">
        {loading && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] p-5 shadow-glass backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[var(--persona-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Analyzing portfolio...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 shadow-glass backdrop-blur-md">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={onClose} className="mt-2 text-xs font-medium text-red-400/70 hover:text-red-400">
              Dismiss
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {action === 'rebalance' && <RebalancingCard data={data} onClose={onClose} onAskAI={handleAskAI} />}
            {action === 'tax-loss' && <TaxLossCard data={data} onClose={onClose} onAskAI={handleAskAI} />}
            {action === 'stress-test' && (
              <StressTestCard
                allocation={analysis?.current_allocation}
                totalValue={analysis?.total_value}
                onClose={onClose}
                onAskAI={handleAskAI}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}
