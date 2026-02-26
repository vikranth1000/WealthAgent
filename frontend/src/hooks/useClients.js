import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { seedAnalysisCache } from './usePortfolio.js'

const PERSONA_META = {
  conservative_retiree: {
    label: 'Conservative Retiree',
    initials: (name) => name.split(' ').map((w) => w[0]).join(''),
    avatarColor: 'bg-blue-600',
  },
  aggressive_growth: {
    label: 'Aggressive Growth',
    initials: (name) => name.split(' ').map((w) => w[0]).join(''),
    avatarColor: 'bg-orange-500',
  },
  young_professional: {
    label: 'Young Professional',
    initials: (name) => name.split(' ').map((w) => w[0]).join(''),
    avatarColor: 'bg-purple-500',
  },
  institutional: {
    label: 'Institutional',
    initials: (name) => name.split(' ').map((w) => w[0]).join(''),
    avatarColor: 'bg-teal',
  },
}

function formatCurrency(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value).toLocaleString()}`
  return `$${value.toFixed(0)}`
}

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchClients() {
      setLoading(true)
      setError(null)
      try {
        const { clients: rawClients } = await api.getClients()

        // Show clients immediately without waiting for analysis (no yfinance)
        const enriched = rawClients.map((c) => {
          const meta = PERSONA_META[c.persona] || PERSONA_META.conservative_retiree

          let occupation = ''
          if (c.persona === 'conservative_retiree') occupation = 'Retired'
          else if (c.persona === 'aggressive_growth') occupation = 'Growth Investor'
          else if (c.persona === 'young_professional') occupation = 'Professional'
          else if (c.persona === 'institutional') occupation = 'Institutional'

          return {
            id: c.id,
            name: c.name,
            persona: c.persona,
            personaLabel: meta.label,
            riskTolerance: c.risk_tolerance,
            totalValue: null,
            totalValueRaw: null,
            initials: meta.initials(c.name),
            avatarColor: meta.avatarColor,
            occupation,
          }
        })

        if (!cancelled) {
          setClients(enriched)
          setLoading(false)
        }

        // Lazily fetch analysis for each client in background to populate
        // portfolio values. Only fetch for the sidebar display, not full prefetch.
        for (const c of enriched) {
          if (cancelled) break
          api.getAnalysis(c.id).then((analysis) => {
            if (cancelled) return
            seedAnalysisCache(c.id, analysis)
            setClients((prev) =>
              prev.map((client) =>
                client.id === c.id
                  ? {
                      ...client,
                      totalValue: analysis.total_value != null
                        ? formatCurrency(analysis.total_value)
                        : client.totalValue,
                      totalValueRaw: analysis.total_value ?? client.totalValueRaw,
                    }
                  : client
              )
            )
          }).catch(() => {
            // Analysis unavailable for this client, leave totalValue as null
          })
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClients()
    return () => { cancelled = true }
  }, [])

  return { clients, loading, error }
}
