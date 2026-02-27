'use client'

import type { ExecutiveState } from '@/core/contracts/executive'
import { useEffect, useState } from 'react'

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
          credentials: 'include',
          cache: 'no-store' // 🔥 مهم جداً عشان ميبقاش فيه cached contract قديم
        })

        if (!res.ok) {
          throw new Error(`HTTP_${res.status}`)
        }

        const json = await res.json()

        // 🔒 Contract Lock
        if (
          json.contract !== 'EXECUTIVE_STATE_V1' ||
          json.version !== '1.0.0' ||
          !json.success ||
          !json.data
        ) {
          console.error('CONTRACT_DEBUG', json)
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