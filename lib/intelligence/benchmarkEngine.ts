import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BenchmarkMetrics {
  model_name: string
  reliability_score: number    // 0–100 inverse of failure/error rate
  safety_score: number         // 0–100 inverse of guardrail trigger rate
  hallucination_rate: number   // 0–100 ratio of flagged hallucinations
  policy_adherence: number     // 0–100 ratio of policy-passing evaluations
  governance_index: number     // composite weighted score
}

export interface BenchmarkReport {
  org_id: string
  models: BenchmarkMetrics[]
  calculated_at: string
  top_model: string | null
  avg_governance_index: number
}

// ── Score helpers ─────────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10))
}

function computeGovernanceIndex(m: Omit<BenchmarkMetrics, 'governance_index'>): number {
  // Weighted composite: reliability 30%, safety 30%, policy adherence 25%, (100 - hallucination) 15%
  return clamp(
    m.reliability_score * 0.30 +
    m.safety_score * 0.30 +
    m.policy_adherence * 0.25 +
    (100 - m.hallucination_rate) * 0.15
  )
}

// ── Data aggregation ──────────────────────────────────────────────────────────

async function aggregateEvaluationMetrics(orgId: string) {
  // Pull session evaluations grouped by model_version
  const { data: sessions } = await supabase
    .from('sessions')
    .select('model_version, risk_score, status')
    .eq('org_id', orgId)
    .not('model_version', 'is', null)

  // Pull guardrail triggers
  const { data: guardrailEvents } = await supabase
    .from('governance_event_ledger')
    .select('event_type, metadata')
    .eq('org_id', orgId)
    .eq('event_type', 'guardrail_triggered')

  // Pull behavior forensics
  const { data: forensics } = await supabase
    .from('behavior_forensics')
    .select('signal_type, signal_score, session_id')
    .eq('org_id', orgId)

  // Pull incident responses
  const { data: incidents } = await supabase
    .from('incident_responses')
    .select('created_at')
    .eq('org_id', orgId)

  return { sessions: sessions ?? [], guardrailEvents: guardrailEvents ?? [], forensics: forensics ?? [], incidents: incidents ?? [] }
}

// ── Benchmark computation ─────────────────────────────────────────────────────

export class BenchmarkEngine {
  /**
   * Compute benchmark metrics for all models used by an org and persist results.
   */
  static async computeBenchmarks(orgId: string): Promise<BenchmarkReport> {
    const { sessions, guardrailEvents, forensics, incidents } = await aggregateEvaluationMetrics(orgId)

    // Group sessions by model
    const byModel = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
      const key = s.model_version ?? 'unknown'
      if (!acc[key]) acc[key] = []
      acc[key].push(s)
      return acc
    }, {})

    const totalGuardrails = guardrailEvents.length
    const totalSessions = sessions.length || 1
    const totalIncidents = incidents.length

    const models: BenchmarkMetrics[] = Object.entries(byModel).map(([model, modelSessions]) => {
      const n = modelSessions.length || 1

      // Reliability: fraction of sessions that completed without high-risk flag
      const failedCount = modelSessions.filter(s => (s.risk_score ?? 0) > 0.7 || s.status === 'failed').length
      const reliability_score = clamp(((n - failedCount) / n) * 100)

      // Safety: inverse of guardrail firing rate relative to this model's sessions
      const modelGuardrailShare = totalSessions > 0 ? (n / totalSessions) * totalGuardrails : 0
      const safety_score = clamp(100 - (modelGuardrailShare / n) * 100)

      // Hallucination rate: forensics signals of type 'intent_drift' / 'prompt_violation'
      const hallucinationSignals = forensics.filter(f =>
        ['intent_drift', 'prompt_violation'].includes(f.signal_type)
      ).length
      const hallucination_rate = clamp((hallucinationSignals / Math.max(totalSessions, 1)) * 100)

      // Policy adherence: inverse of incident rate per session
      const incidentRate = (totalIncidents / totalSessions) * 100
      const policy_adherence = clamp(100 - incidentRate)

      const partial = { model_name: model, reliability_score, safety_score, hallucination_rate, policy_adherence }
      return { ...partial, governance_index: computeGovernanceIndex(partial) }
    })

    // If no real model data, synthesize a placeholder so the panel always renders
    if (models.length === 0) {
      const placeholder: BenchmarkMetrics = {
        model_name: 'No model data',
        reliability_score: 0,
        safety_score: 0,
        hallucination_rate: 0,
        policy_adherence: 0,
        governance_index: 0,
      }
      models.push(placeholder)
    }

    const now = new Date().toISOString()
    const avg_governance_index = clamp(
      models.reduce((s, m) => s + m.governance_index, 0) / models.length
    )
    const topModel = models.sort((a, b) => b.governance_index - a.governance_index)[0]

    // Persist snapshot for each model
    if (orgId && models[0].model_name !== 'No model data') {
      await supabase.from('governance_benchmarks').insert(
        models.map(m => ({
          org_id: orgId,
          model_name: m.model_name,
          reliability_score: m.reliability_score,
          safety_score: m.safety_score,
          hallucination_rate: m.hallucination_rate,
          policy_adherence: m.policy_adherence,
          calculated_at: now,
        }))
      )
    }

    return {
      org_id: orgId,
      models,
      calculated_at: now,
      top_model: topModel?.model_name ?? null,
      avg_governance_index,
    }
  }

  /**
   * Return the most recent persisted benchmark records for an org.
   */
  static async getLatestBenchmarks(orgId: string): Promise<BenchmarkReport> {
    const { data } = await supabase
      .from('governance_benchmarks')
      .select('*')
      .eq('org_id', orgId)
      .order('calculated_at', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) {
      // Fall back to computing fresh
      return BenchmarkEngine.computeBenchmarks(orgId)
    }

    const models: BenchmarkMetrics[] = data.map(r => ({
      model_name: r.model_name,
      reliability_score: r.reliability_score,
      safety_score: r.safety_score,
      hallucination_rate: r.hallucination_rate,
      policy_adherence: r.policy_adherence,
      governance_index: computeGovernanceIndex(r),
    }))

    const avg_governance_index = clamp(
      models.reduce((s, m) => s + m.governance_index, 0) / models.length
    )

    return {
      org_id: orgId,
      models,
      calculated_at: data[0].calculated_at,
      top_model: models[0]?.model_name ?? null,
      avg_governance_index,
    }
  }
}
