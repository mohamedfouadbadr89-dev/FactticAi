'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ExecutiveData {
  healthScore: number | null
  driftSeries: any[]
  alerts: any[]
  investigations: any[]
  snapshot: any | null
}

export function useExecutiveData() {
  const [data, setData] = useState<ExecutiveData>({
    healthScore: null,
    driftSeries: [],
    alerts: [],
    investigations: [],
    snapshot: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [trendRes, timeseriesRes, alertsRes, investigationsRes, healthRes] = await Promise.all([
        fetch('/api/governance/trend'),
        fetch('/api/governance/timeseries'),
        fetch('/api/governance/alerts'),
        fetch('/api/governance/investigations'),
        fetch('/api/governance/composite-health')
      ])

      const [trendJson, timeseriesJson, alertsJson, investigationsJson, healthJson] = await Promise.all([
        trendRes.json(),
        timeseriesRes.json(),
        alertsRes.json(),
        investigationsRes.json(),
        healthRes.json()
      ])

      // Check for errors in responses
      if (!trendRes.ok) throw new Error(trendJson.error || 'TREND_FETCH_FAILED')
      if (!timeseriesRes.ok) throw new Error(timeseriesJson.error || 'TIMESERIES_FETCH_FAILED')
      if (!alertsRes.ok) throw new Error(alertsJson.error || 'ALERTS_FETCH_FAILED')
      if (!investigationsRes.ok) throw new Error(investigationsJson.error || 'INVESTIGATIONS_FETCH_FAILED')
      if (!healthRes.ok) throw new Error(healthJson.error || 'HEALTH_FETCH_FAILED')

      setData({
        healthScore: healthJson.data?.composite_health ?? 0,
        driftSeries: timeseriesJson.data ?? [],
        alerts: alertsJson.data ?? [],
        investigations: investigationsJson.data ?? [],
        // Use the first trend item as the representative snapshot if not specified
        snapshot: trendJson.data?.[0] ?? null
      })
    } catch (err: any) {
      console.error('useExecutiveData Error:', err)
      setError(err.message || 'UNKNOWN_ERROR')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, loading, error, refresh: fetchData }
}
