import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DriftSnapshot {
  model_name:            string
  hallucination_rate:    number
  policy_violation_rate: number
  confidence_drop:       number
  drift_score:           number
  recorded_at:           string
}

export type DriftStatus = 'stable' | 'drifting' | 'critical'

export interface ModelDriftReport {
  model_name:      string
  latest:          DriftSnapshot
  baseline:        DriftSnapshot | null
  deltas: {
    hallucination_rate_delta:    number
    policy_violation_delta:      number
    confidence_delta:            number
  }
  drift_status:    DriftStatus
  stability_score: number       // 100 = fully stable
  timeline:        DriftSnapshot[]
}

// ── Drift classification ──────────────────────────────────────────────────────

function classifyDrift(driftScore: number): DriftStatus {
  if (driftScore >= 65) return 'critical'
  if (driftScore >= 35) return 'drifting'
  return 'stable'
}

function computeStabilityScore(driftScore: number): number {
  return Math.round(Math.max(0, 100 - driftScore))
}

// ── Weighted drift score ──────────────────────────────────────────────────────
// hallucination 40% · policy violations 35% · confidence drop 25%

function weightedDrift(
  hallucinationRate: number,
  policyViolationRate: number,
  confidenceDrop: number
): number {
  const raw = hallucinationRate * 0.4 + policyViolationRate * 0.35 + confidenceDrop * 0.25
  return Math.min(100, Math.round(raw * 10) / 10)
}

// ── Engine ────────────────────────────────────────────────────────────────────

export class ModelDriftEngine {
  /**
   * Record a new drift snapshot for a model.
   * Call this periodically (e.g., after each evaluation batch).
   */
  static async recordSnapshot(
    orgId: string,
    modelName: string,
    hallucinationRate: number,
    policyViolationRate: number,
    confidenceDrop: number
  ): Promise<DriftSnapshot> {
    const driftScore = weightedDrift(hallucinationRate, policyViolationRate, confidenceDrop)
    const now = new Date().toISOString()

    await supabase.from('model_drift_metrics').insert({
      org_id:                orgId,
      model_name:            modelName,
      hallucination_rate:    Math.min(100, Math.max(0, hallucinationRate)),
      policy_violation_rate: Math.min(100, Math.max(0, policyViolationRate)),
      confidence_drop:       Math.min(100, Math.max(0, confidenceDrop)),
      drift_score:           driftScore,
      recorded_at:           now,
    })

    return { model_name: modelName, hallucination_rate: hallucinationRate, policy_violation_rate: policyViolationRate, confidence_drop: confidenceDrop, drift_score: driftScore, recorded_at: now }
  }

  /**
   * Compute full drift reports for all models in an org.
   * Compares latest snapshot against 7-day average baseline.
   */
  static async computeDriftReports(orgId: string): Promise<ModelDriftReport[]> {
    // Fetch all snapshots for this org in the last 30 days
    const { data: rows } = await supabase
      .from('model_drift_metrics')
      .select('*')
      .eq('org_id', orgId)
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true })

    if (!rows || rows.length === 0) return []

    // Group by model
    const byModel: Record<string, DriftSnapshot[]> = {}
    for (const row of rows) {
      if (!byModel[row.model_name]) byModel[row.model_name] = []
      byModel[row.model_name].push({
        model_name:            row.model_name,
        hallucination_rate:    Number(row.hallucination_rate),
        policy_violation_rate: Number(row.policy_violation_rate),
        confidence_drop:       Number(row.confidence_drop),
        drift_score:           Number(row.drift_score),
        recorded_at:           row.recorded_at,
      })
    }

    const reports: ModelDriftReport[] = []

    for (const [modelName, snapshots] of Object.entries(byModel)) {
      const latest = snapshots[snapshots.length - 1]

      // Baseline = average of snapshots older than 7 days (or first half if all recent)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const olderSnaps = snapshots.filter(s => new Date(s.recorded_at).getTime() < sevenDaysAgo)
      const baselineSnaps = olderSnaps.length > 0 ? olderSnaps : snapshots.slice(0, Math.max(1, Math.floor(snapshots.length / 2)))

      const avg = (arr: DriftSnapshot[], key: keyof DriftSnapshot) =>
        (arr.reduce((sum, s) => sum + (s[key] as number), 0) / arr.length)

      const baseline: DriftSnapshot | null = baselineSnaps.length > 0 ? {
        model_name:            modelName,
        hallucination_rate:    avg(baselineSnaps, 'hallucination_rate'),
        policy_violation_rate: avg(baselineSnaps, 'policy_violation_rate'),
        confidence_drop:       avg(baselineSnaps, 'confidence_drop'),
        drift_score:           avg(baselineSnaps, 'drift_score'),
        recorded_at:           baselineSnaps[0].recorded_at,
      } : null

      const deltas = baseline ? {
        hallucination_rate_delta:  Math.round((latest.hallucination_rate  - baseline.hallucination_rate)  * 10) / 10,
        policy_violation_delta:    Math.round((latest.policy_violation_rate - baseline.policy_violation_rate) * 10) / 10,
        confidence_delta:          Math.round((latest.confidence_drop       - baseline.confidence_drop)       * 10) / 10,
      } : { hallucination_rate_delta: 0, policy_violation_delta: 0, confidence_delta: 0 }

      reports.push({
        model_name:      modelName,
        latest,
        baseline,
        deltas,
        drift_status:    classifyDrift(latest.drift_score),
        stability_score: computeStabilityScore(latest.drift_score),
        timeline:        snapshots.slice(-20), // last 20 snapshots for chart
      })
    }

    // Sort by worst drift first
    reports.sort((a, b) => b.latest.drift_score - a.latest.drift_score)
    return reports
  }

  /**
   * Seed synthetic drift snapshots for demonstration when no real data exists.
   */
  static async seedDemoData(orgId: string): Promise<void> {
    const models = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro']
    const now = Date.now()

    const rows = models.flatMap(model =>
      Array.from({ length: 10 }, (_, i) => {
        const base = Math.random() * 20
        const drift = i > 6 ? base + Math.random() * 30 : base
        return {
          org_id:                orgId,
          model_name:            model,
          hallucination_rate:    Math.min(100, base + Math.random() * 10),
          policy_violation_rate: Math.min(100, base + Math.random() * 8),
          confidence_drop:       Math.min(100, Math.random() * 15),
          drift_score:           Math.min(100, drift),
          recorded_at:           new Date(now - (10 - i) * 3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      })
    )

    await supabase.from('model_drift_metrics').insert(rows)
  }
}
