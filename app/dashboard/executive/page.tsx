'use client'

import { useExecutive } from './useExecutive'
import { StatCard } from '../components/StatCard'

function getRiskTone(score: number): 'stable' | 'watch' | 'critical' {
  if (score > 0.7) return 'stable'
  if (score >= 0.4) return 'watch'
  return 'critical'
}

function formatPercent(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export default function ExecutivePage() {
  const { data, loading, error } = useExecutive()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading Executive Metrics...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
        No Executive Data Available
      </div>
    )
  }

  const tone = getRiskTone(data.metrics.governance_score)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-12">
      <div className="max-w-7xl mx-auto">

        <div className="mb-12">
          <h1 className="text-4xl font-bold">
            Executive Risk Overview
          </h1>
          <p className="text-slate-400 mt-2">
            Deterministic Governance Snapshot – 30 Day Window
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

          <StatCard
            title="Governance Score"
            value={data.metrics.governance_score.toFixed(2)}
            tone={tone}
          />

          <StatCard
            title="Drift"
            value={formatPercent(data.metrics.drift)}
          />

          <StatCard
            title="Sessions (30d)"
            value={data.metrics.sessions_30d.toString()}
          />

          <StatCard
            title="Active Alerts"
            value={data.metrics.active_alerts.toString()}
          />

        </div>

      </div>
    </div>
  )
}