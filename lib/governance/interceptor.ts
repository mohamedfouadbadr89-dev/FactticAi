import { createClient } from '@supabase/supabase-js'
import { GuardrailEngine } from './guardrailEngine'
import { logger } from '../logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type InterceptAction = 'ALLOW' | 'WARN' | 'BLOCK' | 'ESCALATE'

export interface InterceptRequest {
  org_id: string
  session_id: string
  agent_response: string
  model?: string | undefined
  metadata?: Record<string, unknown> | undefined
}

export interface InterceptDecision {
  action: InterceptAction
  reason: string
  risk_score: number
  latency_ms: number
}

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|your)\s+(instructions?|rules?|prompt)/i,
  /developer\s+mode/i,
  /<\|im_start\|>system/i,
]

const PII_PATTERNS = [
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i
]

function computeTextRisk(text: string) {

  const flags: string[] = []
  let score = 0

  if (INJECTION_PATTERNS.some(r => r.test(text))) {
    flags.push('prompt_injection')
    score += 40
  }

  if (PII_PATTERNS.some(r => r.test(text))) {
    flags.push('pii_exposure')
    score += 30
  }

  if (text.length < 10) {
    flags.push('short_response')
    score += 5
  }

  return { score: Math.min(score,100), flags }
}

function resolveAction(score: number): InterceptAction {

  if (score >= 75) return 'BLOCK'
  if (score >= 50) return 'ESCALATE'
  if (score >= 25) return 'WARN'
  return 'ALLOW'
}

export class GovernanceInterceptor {

  static async evaluate(req: InterceptRequest): Promise<InterceptDecision> {

    const t0 = Date.now()

    const { score, flags } = computeTextRisk(req.agent_response)

    let guardrailScore = 0

    try {

      const gr = await GuardrailEngine.evaluateResponse({
        org_id: req.org_id,
        response_text: req.agent_response,
        context: req.metadata
      })

      guardrailScore =
        (gr.metrics.hallucination_risk * 0.3 +
        gr.metrics.policy_risk * 0.3 +
        gr.metrics.tone_risk * 0.2 +
        gr.metrics.safety_risk * 0.2) * 100

    } catch (e) {
      logger.warn('GUARDRAIL_FALLBACK')
    }

    const finalScore = Math.min(100, score * 0.6 + guardrailScore * 0.4)

    const action = resolveAction(finalScore)

    const latency_ms = Date.now() - t0

    void GovernanceInterceptor.persistEvent(req, action, finalScore)

    return {
      action,
      reason: flags.join(', ') || 'no_risk_signals',
      risk_score: Math.round(finalScore),
      latency_ms
    }
  }

  private static async persistEvent(
    req: InterceptRequest,
    action: InterceptAction,
    riskScore: number
  ) {

    try {

      await supabase.from('interceptor_events').insert({
        org_id: req.org_id,
        session_id: req.session_id,
        action,
        risk_score: riskScore
      })

    } catch (e) {
      logger.warn('INTERCEPT_EVENT_WRITE_FAILED')
    }
  }

  static async getRecentEvents(orgId: string, limit = 30) {

    const { data } = await supabase
      .from('interceptor_events')
      .select('id, session_id, action, risk_score, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data ?? []
  }
}