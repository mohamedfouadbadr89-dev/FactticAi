import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

export interface RcaGraphOutput {
  root_cause: string
  causal_chain: string[]
  confidence_score: number
}

/**
 * RCA Graph Engine v3
 *
 * CORE PRINCIPLE: Temporal + causal mapping across governance signals.
 * Reads exclusively from facttic_governance_events (canonical table).
 */
export class RcaGraphEngine {

  static async analyzeSession(sessionId: string, orgId: string): Promise<RcaGraphOutput | null> {

    try {

      const { data: events, error } = await supabaseServer
        .from('facttic_governance_events')
        .select('id, session_id, org_id, timestamp, event_type, decision, risk_score, violations, guardrail_signals')
        .eq('session_id', sessionId)
        .eq('org_id', orgId)
        .order('timestamp', { ascending: true })

      if (error || !events || events.length === 0) {

        logger.warn('RCA_GRAPH_NO_EVENTS', { sessionId })

        return {
          root_cause: 'no_data',
          causal_chain: [],
          confidence_score: 0
        }
      }

      const significantEvents = events.filter((e: any) => {

        const guardrail = (e.guardrail_signals || {}) as any
        const violations = Array.isArray(e.violations) ? e.violations : []

        return (
          e.decision === 'BLOCK' ||
          violations.length > 0 ||
          (e.risk_score && e.risk_score > 70) ||
          (guardrail.drift_score && guardrail.drift_score > 0.5)
        )
      })

      if (significantEvents.length === 0) {

        return {
          root_cause: 'nominal_behavior',
          causal_chain: ['no_high_risk_signals_detected'],
          confidence_score: 1.0
        }
      }

      // Build causal chain from violation rule types or decision outcomes
      const causalChain: string[] = significantEvents.map((e: any) => {
        const violations = Array.isArray(e.violations) ? e.violations : []
        if (violations.length > 0) {
          return violations[0]?.rule_type || violations[0]?.policy_name || e.decision
        }
        const guardrail = (e.guardrail_signals || {}) as any
        if (guardrail.drift_score && guardrail.drift_score > 0.5) return 'drift_detected'
        return e.decision || 'governance_escalation'
      })

      // Determine root cause from signal patterns
      let rootCause = causalChain[0]
      let confidence = 0.85

      const hasDrift = significantEvents.some((e: any) => {
        const g = (e.guardrail_signals || {}) as any
        return g.drift_score && g.drift_score > 0.5
      })

      if (hasDrift && causalChain.slice(0, 2).includes('drift_detected')) {

        rootCause = 'model_drift'
        confidence = 0.92

      } else if (significantEvents[0]?.decision === 'BLOCK') {

        rootCause = 'policy_non_compliance'
        confidence = 0.88
      }

      const trace = significantEvents.map((e: any) => {
        const violations = Array.isArray(e.violations) ? e.violations : []
        if (violations.length > 0) {
          return violations[0]?.explanation || violations[0]?.rule_type || e.decision
        }
        return e.decision || e.event_type
      })

      logger.info('RCA_GRAPH_ANALYSIS_COMPLETE', {
        sessionId,
        rootCause,
        confidence
      })

      return {
        root_cause: rootCause,
        causal_chain: trace,
        confidence_score: confidence
      }

    } catch (err: any) {

      logger.error('RCA_GRAPH_ENGINE_FAILURE', {
        sessionId,
        error: err.message
      })

      return null
    }
  }
}
