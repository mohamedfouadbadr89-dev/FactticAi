import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

export interface RcaGraphOutput {
  root_cause: string
  causal_chain: string[]
  confidence_score: number
}

/**
 * RCA Graph Engine v2
 *
 * CORE PRINCIPLE
 * Temporal + causal mapping across governance signals
 */
export class RcaGraphEngine {

  static async analyzeSession(sessionId: string): Promise<RcaGraphOutput | null> {

    try {

      const { data: events, error } = await supabaseServer
        .from('conversation_timeline')
        .select('*')
        .eq('session_id', sessionId)
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

        const payload = (e.event_payload || {}) as any

        return (
          e.event_type === 'policy_violation' ||
          e.event_type === 'drift_detected' ||
          e.event_type === 'governance_escalation' ||
          (payload.risk_score && payload.risk_score > 70)
        )
      })

      if (significantEvents.length === 0) {

        return {
          root_cause: 'nominal_behavior',
          causal_chain: ['no_high_risk_signals_detected'],
          confidence_score: 1.0
        }
      }

      const causalChain: string[] = significantEvents.map((e: any) => e.event_type)

      let rootCause = causalChain[0]
      let confidence = 0.85

      const driftIndex = causalChain.indexOf('drift_detected')

      if (driftIndex !== -1 && driftIndex < 2) {

        rootCause = 'model_drift'
        confidence = 0.92

      } else if (causalChain[0] === 'policy_violation') {

        rootCause = 'policy_non_compliance'
        confidence = 0.88
      }

      const trace = significantEvents.map((e: any) => {

        const payload = (e.event_payload || {}) as any

        return payload.reason || e.event_type
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