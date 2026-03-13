import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DriftSnapshot {
  model_name: string
  hallucination_rate: number
  policy_violation_rate: number
  confidence_drop: number
  drift_score: number
  recorded_at: string
}

export type DriftStatus = 'stable' | 'drifting' | 'critical'

export interface ModelDriftReport {
  model_name: string
  latest: DriftSnapshot
  baseline: DriftSnapshot | null
  deltas: {
    hallucination_rate_delta: number
    policy_violation_delta: number
    confidence_delta: number
  }
  drift_status: DriftStatus
  stability_score: number
  timeline: DriftSnapshot[]
}

function classifyDrift(score: number): DriftStatus {
  if (score >= 65) return 'critical'
  if (score >= 35) return 'drifting'
  return 'stable'
}

function stability(score: number) {
  return Math.round(Math.max(0, 100 - score))
}

function weightedDrift(
  hallucinationRate: number,
  policyViolationRate: number,
  confidenceDrop: number
) {

  const raw =
    hallucinationRate * 0.4 +
    policyViolationRate * 0.35 +
    confidenceDrop * 0.25

  return Math.min(100, Math.round(raw * 10) / 10)
}

export class ModelDriftEngine {

  static async recordSnapshot(
    orgId: string,
    modelName: string,
    hallucinationRate: number,
    policyViolationRate: number,
    confidenceDrop: number
  ): Promise<DriftSnapshot> {

    const driftScore = weightedDrift(
      hallucinationRate,
      policyViolationRate,
      confidenceDrop
    )

    const now = new Date().toISOString()

    await supabase.from('model_drift_metrics').insert({
      org_id: orgId,
      model_name: modelName,
      hallucination_rate: hallucinationRate,
      policy_violation_rate: policyViolationRate,
      confidence_drop: confidenceDrop,
      drift_score: driftScore,
      recorded_at: now
    })

    logger.info('MODEL_DRIFT_SNAPSHOT_RECORDED', {
      orgId,
      modelName,
      driftScore
    })

    return {
      model_name: modelName,
      hallucination_rate: hallucinationRate,
      policy_violation_rate: policyViolationRate,
      confidence_drop: confidenceDrop,
      drift_score: driftScore,
      recorded_at: now
    }
  }

  static async computeDriftReports(orgId: string): Promise<ModelDriftReport[]> {

    const { data: rows } = await supabase
      .from('model_drift_metrics')
      .select('*')
      .eq('org_id', orgId)
      .order('recorded_at', { ascending: true })

    if (!rows || rows.length === 0) return []

    const byModel: Record<string, DriftSnapshot[]> = {}

    for (const r of rows) {

      if (!byModel[r.model_name]) byModel[r.model_name] = []

      byModel[r.model_name].push({
        model_name: r.model_name,
        hallucination_rate: Number(r.hallucination_rate),
        policy_violation_rate: Number(r.policy_violation_rate),
        confidence_drop: Number(r.confidence_drop),
        drift_score: Number(r.drift_score),
        recorded_at: r.recorded_at
      })
    }

    const reports: ModelDriftReport[] = []

    for (const [model, snaps] of Object.entries(byModel)) {

      const latest = snaps[snaps.length - 1]

      const baseline =
        snaps.length > 1
          ? snaps[Math.floor(snaps.length / 2)]
          : null

      const deltas = baseline
        ? {
            hallucination_rate_delta:
              latest.hallucination_rate - baseline.hallucination_rate,
            policy_violation_delta:
              latest.policy_violation_rate - baseline.policy_violation_rate,
            confidence_delta:
              latest.confidence_drop - baseline.confidence_drop
          }
        : {
            hallucination_rate_delta: 0,
            policy_violation_delta: 0,
            confidence_delta: 0
          }

      reports.push({
        model_name: model,
        latest,
        baseline,
        deltas,
        drift_status: classifyDrift(latest.drift_score),
        stability_score: stability(latest.drift_score),
        timeline: snaps.slice(-20)
      })
    }

    reports.sort((a, b) => b.latest.drift_score - a.latest.drift_score)

    return reports
  }
}