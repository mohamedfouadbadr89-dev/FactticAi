import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CostRecord {
  org_id:      string
  model_name:  string
  token_usage: number
  cost_usd:    number
  risk_score:  number
  session_id?: string
}

export type CostEfficiency = 'efficient' | 'moderate' | 'expensive'

export interface ModelCostReport {
  model_name:           string
  total_tokens:         number
  total_cost_usd:       number
  avg_risk_score:       number
  conversation_count:   number
  cost_per_conversation: number
  cost_per_risk_point:  number      // cost_usd / risk_score — lower is better
  efficiency:           CostEfficiency
  efficiency_score:     number      // 0–100, higher is better
  daily_trend:          { date: string; cost_usd: number; tokens: number }[]
}

export interface OrgCostSummary {
  total_cost_usd:        number
  total_tokens:          number
  avg_cost_per_session:  number
  most_expensive_model:  string
  most_efficient_model:  string
  models:                ModelCostReport[]
}

// ── Efficiency classification ─────────────────────────────────────────────────
// Efficiency score = 100 − weighted penalty
// Penalty weights: cost_per_token 50%, risk_per_dollar 50%

function computeEfficiencyScore(
  costPerToken: number,     // USD per token
  riskPerDollar: number     // risk points per dollar spent
): number {
  // Benchmark: $0.000003/token = 100%, $0.00003/token = 0%
  const tokenPenalty   = Math.min(100, (costPerToken / 0.00003) * 100)
  // Benchmark: >30 risk/dollar = bad; <5 risk/dollar = good
  const riskPenalty    = Math.min(100, (riskPerDollar / 30) * 100)
  const score = Math.round(Math.max(0, 100 - tokenPenalty * 0.50 - riskPenalty * 0.50))
  return score
}

function classifyEfficiency(score: number): CostEfficiency {
  if (score >= 65) return 'efficient'
  if (score >= 35) return 'moderate'
  return 'expensive'
}

// ── Engine ────────────────────────────────────────────────────────────────────

export class CostEngine {
  /** Record a cost metric entry (call after each AI conversation). */
  static async recordCost(record: CostRecord): Promise<void> {
    await supabase.from('cost_metrics').insert({
      org_id:      record.org_id,
      model_name:  record.model_name,
      token_usage: Math.max(0, Math.round(record.token_usage)),
      cost_usd:    Math.max(0, record.cost_usd),
      risk_score:  Math.min(100, Math.max(0, record.risk_score)),
      session_id:  record.session_id ?? null,
    })
  }

  /** Compute cost efficiency reports per model for an org (last 30 days). */
  static async computeReports(orgId: string): Promise<OrgCostSummary> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: rows } = await supabase
      .from('cost_metrics')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (!rows || rows.length === 0) {
      return { total_cost_usd: 0, total_tokens: 0, avg_cost_per_session: 0, most_expensive_model: '—', most_efficient_model: '—', models: [] }
    }

    // Group by model
    const byModel: Record<string, typeof rows> = {}
    for (const row of rows) {
      if (!byModel[row.model_name]) byModel[row.model_name] = []
      byModel[row.model_name].push(row)
    }

    const modelReports: ModelCostReport[] = []

    for (const [modelName, records] of Object.entries(byModel)) {
      const totalTokens = records.reduce((s, r) => s + Number(r.token_usage), 0)
      const totalCost   = records.reduce((s, r) => s + Number(r.cost_usd), 0)
      const avgRisk     = records.reduce((s, r) => s + Number(r.risk_score), 0) / records.length

      const costPerToken   = totalTokens > 0 ? totalCost / totalTokens : 0
      const riskPerDollar  = totalCost > 0 ? avgRisk / totalCost : 0
      const effScore       = computeEfficiencyScore(costPerToken, riskPerDollar)

      // Build daily trend (last 14 days)
      const dailyMap: Record<string, { cost_usd: number; tokens: number }> = {}
      for (const r of records) {
        const day = r.created_at.slice(0, 10)
        if (!dailyMap[day]) dailyMap[day] = { cost_usd: 0, tokens: 0 }
        dailyMap[day].cost_usd  += Number(r.cost_usd)
        dailyMap[day].tokens    += Number(r.token_usage)
      }
      const dailyTrend = Object.entries(dailyMap)
        .map(([date, v]) => ({ date, cost_usd: Math.round(v.cost_usd * 1e6) / 1e6, tokens: v.tokens }))
        .slice(-14)

      modelReports.push({
        model_name:            modelName,
        total_tokens:          totalTokens,
        total_cost_usd:        Math.round(totalCost * 1e6) / 1e6,
        avg_risk_score:        Math.round(avgRisk * 10) / 10,
        conversation_count:    records.length,
        cost_per_conversation: records.length > 0 ? Math.round((totalCost / records.length) * 1e6) / 1e6 : 0,
        cost_per_risk_point:   avgRisk > 0 ? Math.round((totalCost / avgRisk) * 1e6) / 1e6 : 0,
        efficiency:            classifyEfficiency(effScore),
        efficiency_score:      effScore,
        daily_trend:           dailyTrend,
      })
    }

    // Sort by total cost desc
    modelReports.sort((a, b) => b.total_cost_usd - a.total_cost_usd)

    const totalCostAll   = modelReports.reduce((s, m) => s + m.total_cost_usd, 0)
    const totalTokensAll = modelReports.reduce((s, m) => s + m.total_tokens, 0)
    const totalSessions  = modelReports.reduce((s, m) => s + m.conversation_count, 0)

    return {
      total_cost_usd:        Math.round(totalCostAll * 1e6) / 1e6,
      total_tokens:          totalTokensAll,
      avg_cost_per_session:  totalSessions > 0 ? Math.round((totalCostAll / totalSessions) * 1e6) / 1e6 : 0,
      most_expensive_model:  modelReports[0]?.model_name ?? '—',
      most_efficient_model:  [...modelReports].sort((a, b) => b.efficiency_score - a.efficiency_score)[0]?.model_name ?? '—',
      models:                modelReports,
    }
  }

  /** Seed demo cost data for the dashboard. */
  static async seedDemoData(orgId: string): Promise<void> {
    const models = [
      { name: 'gpt-4o',              tokensPerCall: 2200, costPer1k: 0.015, baseRisk: 25 },
      { name: 'claude-3-5-sonnet',   tokensPerCall: 1800, costPer1k: 0.012, baseRisk: 18 },
      { name: 'gemini-1.5-pro',      tokensPerCall: 1400, costPer1k: 0.007, baseRisk: 22 },
      { name: 'gpt-3.5-turbo',       tokensPerCall: 800,  costPer1k: 0.002, baseRisk: 40 },
    ]

    const now = Date.now()
    const rows = models.flatMap(m =>
      Array.from({ length: 20 }, (_, i) => {
        const jitter    = 1 + (Math.random() - 0.5) * 0.4
        const tokens    = Math.round(m.tokensPerCall * jitter)
        const costUsd   = (tokens / 1000) * m.costPer1k * jitter
        const riskScore = Math.min(100, m.baseRisk + Math.random() * 20)
        const ts        = new Date(now - (20 - i) * 1.5 * 24 * 60 * 60 * 1000).toISOString()
        return {
          org_id:      orgId,
          model_name:  m.name,
          token_usage: tokens,
          cost_usd:    Math.round(costUsd * 1e6) / 1e6,
          risk_score:  Math.round(riskScore * 10) / 10,
          session_id:  `demo-${m.name}-${i}`,
          created_at:  ts,
        }
      })
    )

    await supabase.from('cost_metrics').insert(rows)
  }
}
