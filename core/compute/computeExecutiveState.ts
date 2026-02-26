import { ExecutiveState, RiskLevel } from '../contracts/executive'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function calculateRisk(governance: number, drift: number): RiskLevel {
  if (governance > 0.8 && drift < 0.02) return 'LOW'
  if (governance > 0.5) return 'MEDIUM'
  if (governance > 0.3) return 'CRITICAL'
  return 'SOVEREIGN'
}

export async function computeExecutiveState(
  orgId: string
): Promise<ExecutiveState> {

  // Pull raw metrics from Supabase
  const { data, error } = await supabase
    .from('telemetry_events')
    .select('*')
    .eq('org_id', orgId)

  if (error) {
    throw new Error('SUPABASE_FETCH_FAILED')
  }

  const sessions = data?.length || 0
  const alerts = data?.filter(e => e.alert === true).length || 0

  const governance_score =
    sessions === 0 ? 0 : Math.max(0, 1 - alerts / sessions)

  const drift =
    sessions === 0 ? 0 : alerts / sessions

  const risk_state = calculateRisk(governance_score, drift)

  return {
    org_id: orgId,
    generated_at: new Date().toISOString(),
    metrics: {
      governance_score,
      drift,
      sessions_30d: sessions,
      active_alerts: alerts,
    },
    risk_state,
    isolation_state: 'LOCKED',
    integrity_ok: true,
  }
}