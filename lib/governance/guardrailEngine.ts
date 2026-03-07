import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger'
import { PolicyEvaluationSignal } from './policyEngine'
import { PolicyViolation } from '../governance/policyResolver'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface GuardrailInterceptRequest {
  org_id: string
  response_text: string
  context?: any
}

export interface GuardrailInterceptResponse {

  signals: PolicyEvaluationSignal[]

  metrics: {
    hallucination_risk: number
    policy_risk: number
    tone_risk: number
    safety_risk: number
  }
}

export const GuardrailEngine = {

  async evaluateResponse(
    request: GuardrailInterceptRequest
  ): Promise<GuardrailInterceptResponse> {

    const { response_text, context } = request

    let hallucinationRisk = 0.05
    let policyRisk = 0.02
    let toneRisk = 0.01
    let safetyRisk = 0.0

    const text = response_text.toLowerCase()

    if (text.includes('confidential') || text.includes('secret'))
      policyRisk += 0.4

    if (text.length < 10)
      toneRisk += 0.3

    if (text.includes('guarantee') || text.includes('100%'))
      hallucinationRisk += 0.6

    if (text.includes('hack') || text.includes('bypass'))
      safetyRisk += 0.9

    if (context?.injectedDeltas) {

      hallucinationRisk =
        context.injectedDeltas.hallucination_risk ?? hallucinationRisk

      policyRisk =
        context.injectedDeltas.policy_risk ?? policyRisk

      toneRisk =
        context.injectedDeltas.tone_risk ?? toneRisk

      safetyRisk =
        context.injectedDeltas.safety_risk ?? safetyRisk
    }

    const metrics = {
      hallucination_risk: Math.min(hallucinationRisk, 1),
      policy_risk: Math.min(policyRisk, 1),
      tone_risk: Math.min(toneRisk, 1),
      safety_risk: Math.min(safetyRisk, 1)
    }

    const signals: PolicyEvaluationSignal[] = [
      { rule_type: 'hallucination_rate', score: metrics.hallucination_risk * 100 },
      { rule_type: 'tone_violation', score: metrics.tone_risk * 100 },
      { rule_type: 'safety_violation', score: metrics.safety_risk * 100 }
    ]

    logger.info('GUARDRAIL_SIGNAL_GENERATED', {
      signals
    })

    return {
      signals,
      metrics
    }
  },

  evaluatePrompt(userPrompt: string): PolicyViolation[] {
    const dataExfiltrationPatterns = [
      /training datasets/i,
      /internal datasets/i,
      /system prompt/i,
      /hidden prompt/i,
      /internal logs/i,
      /private logs/i,
      /model training data/i,
    ]

    const matched = dataExfiltrationPatterns.some(pattern => pattern.test(userPrompt))

    if (!matched) return []

    const violation: PolicyViolation = {
      policy_name: 'DATA_EXFILTRATION',
      explanation: 'Prompt attempts to retrieve internal system information',
      actual_score: 90,
      action: 'BLOCK',
    }

    logger.info('GUARDRAIL_DATA_EXFILTRATION_DETECTED', {
      policy_name: violation.policy_name,
      actual_score: violation.actual_score,
    })

    return [violation]
  }
}