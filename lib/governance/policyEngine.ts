import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type PolicyRuleType =
  | 'hallucination_rate'
  | 'tone_violation'
  | 'pii_exposure'
  | 'instruction_override'
  | 'safety_violation'

export type PolicyAction = 'warn' | 'block' | 'escalate'

export interface GovernancePolicy {
  id: string
  org_id: string
  policy_name: string
  rule_type: PolicyRuleType
  threshold: number
  action: PolicyAction
}

export interface PolicyEvaluationSignal {
  rule_type: PolicyRuleType
  score: number
}

export interface PolicyEvaluationResult {
  triggered: boolean
  highest_action: PolicyAction | null
  violations: {
    policy_name: string
    rule_type: PolicyRuleType
    threshold: number
    actual_score: number
    action: PolicyAction
  }[]
}

export class PolicyEngine {

  static async loadOrganizationPolicies(org_id: string): Promise<GovernancePolicy[]> {

    const { data, error } = await supabase
      .from('governance_policies')
      .select('*')
      .eq('org_id', org_id)

    if (error) {
      logger.error('POLICY_LOAD_FAILED', { org_id, error: error.message })
      return []
    }

    return data ?? []
  }

  static evaluateSignals(
    policies: GovernancePolicy[],
    signals: PolicyEvaluationSignal[]
  ): PolicyEvaluationResult {

    const violations: PolicyEvaluationResult['violations'] = []
    let highestAction: PolicyAction | null = null
    let triggered = false

    const actionWeight = {
      warn: 1,
      escalate: 2,
      block: 3
    }

    for (const signal of signals) {

      const matchingPolicies = policies.filter(
        p => p.rule_type === signal.rule_type
      )

      for (const policy of matchingPolicies) {

        if (signal.score >= policy.threshold) {

          triggered = true

          violations.push({
            policy_name: policy.policy_name,
            rule_type: policy.rule_type,
            threshold: policy.threshold,
            actual_score: signal.score,
            action: policy.action
          })

          if (
            !highestAction ||
            actionWeight[policy.action] > actionWeight[highestAction]
          ) {
            highestAction = policy.action
          }
        }
      }
    }

    logger.info('POLICY_EVALUATION_COMPLETE', {
      triggered,
      violations: violations.length,
      highestAction
    })

    return {
      triggered,
      highest_action: highestAction,
      violations
    }
  }
}