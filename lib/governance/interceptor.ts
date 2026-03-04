import { createClient } from '@supabase/supabase-js'
import { GuardrailEngine } from './guardrailEngine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Risk signal detectors ─────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|your)\s+(instructions?|rules?|prompt)/i,
  /you\s+are\s+now\s+(in\s+)?developer\s+mode/i,
  /<\|im_start\|>system/i,
  /<!--\s*override/i,
  /\[IGNORE\s+PREVIOUS/i,
]

const PII_PATTERNS = [
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,                   // SSN
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,        // Credit card
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i, // Email
  /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone
]

const HALLUCINATION_TRIGGERS = [
  /studies?\s+show\s+that\s+\d+%/i,
  /scientists?\s+(agree|confirm|prove)\s+that/i,
  /fact:\s+[\w\s]{20,}/i,
  /it\s+is\s+a\s+known\s+fact/i,
]

function computeTextRisk(text: string): { score: number; flags: string[] } {
  const flags: string[] = []
  let score = 0

  // Injection patterns (highest weight)
  if (INJECTION_PATTERNS.some(re => re.test(text))) {
    flags.push('prompt_injection_detected')
    score += 40
  }

  // PII exposure
  if (PII_PATTERNS.some(re => re.test(text))) {
    flags.push('pii_exposure')
    score += 30
  }

  // Hallucination signals
  if (HALLUCINATION_TRIGGERS.some(re => re.test(text))) {
    flags.push('hallucination_signal')
    score += 20
  }

  // Length heuristics — abnormally short responses can indicate blocked/evasive
  if (text.length < 10) {
    flags.push('suspiciously_short_response')
    score += 5
  }

  // Profanity/unsafe content count (simplified keyword check)
  const unsafeKeywords = ['illegal', 'weapon', 'hack the', 'bypass security', 'exploit']
  const unsafeCount = unsafeKeywords.filter(kw => text.toLowerCase().includes(kw)).length
  if (unsafeCount > 0) {
    flags.push(`unsafe_content:${unsafeCount}_keywords`)
    score += unsafeCount * 10
  }

  return { score: Math.min(100, score), flags }
}

// ── Decision logic ────────────────────────────────────────────────────────────

function resolveAction(riskScore: number, guardrailAction: string, flags: string[]): InterceptAction {
  // Guardrail hard-block takes priority
  if (guardrailAction === 'block') return 'BLOCK'

  // Injection always escalates regardless of numeric score
  if (flags.includes('prompt_injection_detected')) return 'ESCALATE'

  if (riskScore >= 75) return 'BLOCK'
  if (riskScore >= 50) return 'ESCALATE'
  if (riskScore >= 25) return 'WARN'
  return 'ALLOW'
}

function buildReason(action: InterceptAction, flags: string[], guardrailReason?: string): string {
  if (flags.length === 0 && !guardrailReason) return 'No governance signals detected.'

  const parts: string[] = []
  if (guardrailReason) parts.push(`Guardrail: ${guardrailReason}`)
  if (flags.length) parts.push(`Signals: ${flags.join(', ')}`)

  switch (action) {
    case 'BLOCK':     return `Response blocked. ${parts.join(' | ')}`
    case 'ESCALATE':  return `Response escalated for review. ${parts.join(' | ')}`
    case 'WARN':      return `Warning issued. ${parts.join(' | ')}`
    case 'ALLOW':     return `Response cleared. ${parts.join(' | ')}`
  }
}

// ── Main interceptor ──────────────────────────────────────────────────────────

export class GovernanceInterceptor {
  /**
   * Evaluate an agent response before delivery.
   * Combines text-level heuristics + guardrail engine for a unified decision.
   */
  static async evaluate(req: InterceptRequest): Promise<InterceptDecision> {
    const t0 = Date.now()

    // 1. Fast text-level risk signals (sync, no DB)
    const { score: textScore, flags } = computeTextRisk(req.agent_response)

    // 2. Guardrail engine evaluation (async, DB-backed)
    let guardrailAction = 'pass'
    let guardrailReason: string | undefined

    try {
      const gr = await GuardrailEngine.evaluateResponse({
        org_id: req.org_id,
        response_text: req.agent_response,
        context: req.metadata,
      })
      guardrailAction = gr.action
      guardrailReason = gr.reason

      // Blend guardrail risk metrics into final score
      const blendedGuardrailScore = (
        gr.metrics.hallucination_risk * 0.3 +
        gr.metrics.policy_risk * 0.3 +
        gr.metrics.tone_risk * 0.2 +
        gr.metrics.safety_risk * 0.2
      ) * 100

      // Final score: 60% text heuristics, 40% guardrail blend
      const finalScore = Math.min(100, textScore * 0.6 + blendedGuardrailScore * 0.4)
      const action = resolveAction(finalScore, guardrailAction, flags)
      const reason = buildReason(action, flags, guardrailReason)
      const latency_ms = Date.now() - t0

      // 3. Persist event (fire-and-forget)
      void GovernanceInterceptor.persistEvent(req, action, reason, finalScore)

      return { action, reason, risk_score: Math.round(finalScore * 10) / 10, latency_ms }
    } catch (err) {
      // Guardrail engine unavailable — fall back to text-only score
      console.warn('[Interceptor] Guardrail fallback:', err)
      const action = resolveAction(textScore, 'pass', flags)
      const reason = buildReason(action, flags)
      const latency_ms = Date.now() - t0
      void GovernanceInterceptor.persistEvent(req, action, reason, textScore)
      return { action, reason, risk_score: textScore, latency_ms }
    }
  }

  /** Fire-and-forget persistence — never blocks the calling API */
  private static async persistEvent(
    req: InterceptRequest,
    action: InterceptAction,
    reason: string,
    riskScore: number
  ): Promise<void> {
    try {
      await supabase.from('interceptor_events').insert({
        org_id: req.org_id,
        session_id: req.session_id,
        action,
        reason,
        risk_score: Math.min(100, Math.max(0, riskScore)),
      })
    } catch (err) {
      console.warn('[Interceptor] Persist event failed (non-blocking):', err)
    }
  }

  /** Load recent intercept events for the intelligence dashboard feed */
  static async getRecentEvents(orgId: string, limit = 30): Promise<any[]> {
    const { data } = await supabase
      .from('interceptor_events')
      .select('id, session_id, action, reason, risk_score, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  }
}
