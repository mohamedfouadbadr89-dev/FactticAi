'use client'
import type { ExecutiveState } from '@/core/contracts/executive'
import { useEffect, useState } from 'react'

type ExecutiveData = {
  org_id: string
  generated_at: string
  metrics: {
    governance_score: number
    drift: number
    sessions_30d: number
    active_alerts: number
  }
  risk_state: string
  isolation_state: string
  integrity_ok: boolean
}

export function useExecutive() {
  const [data, setData] = useState<ExecutiveState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/governance/executive-state', {
          method: 'GET',
          credentials: 'include'
        })

        const json = await res.json()

        if (
  !res.ok ||
  !json.success ||
  json.contract !== 'EXECUTIVE_STATE_V1' ||
  json.version !== '1.0.0'
) {
  throw new Error('EXECUTIVE_CONTRACT_MISMATCH')
}

        setData(json.data)
      } catch (err: any) {
        console.error('EXECUTIVE_FETCH_ERROR', err)
        setError(err.message || 'UNKNOWN_ERROR')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { data, loading, error }
}