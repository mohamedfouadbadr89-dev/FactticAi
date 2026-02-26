// ========================================================
// EXECUTIVE STATE CONTRACT
// VERSION: 1.0.0 – FROZEN
// DO NOT MODIFY WITHOUT VERSION BUMP
// ========================================================

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'CRITICAL'
  | 'SOVEREIGN'

export interface ExecutiveMetrics {
  governance_score: number
  drift: number
  sessions_30d: number
  active_alerts: number
}

export interface ExecutiveState {
  org_id: string
  generated_at: string
  metrics: ExecutiveMetrics
  risk_state: RiskLevel
  isolation_state: 'LOCKED' | 'BREACHED'
  integrity_ok: boolean
}