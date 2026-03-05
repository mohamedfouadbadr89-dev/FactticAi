/**
 * RCA ENGINE v1 (DEPRECATED WRAPPER)
 *
 * This module is preserved for backward compatibility only.
 * All RCA analysis now flows through RCA Graph Engine v2.
 *
 * DO NOT use this module for new development.
 */

import { buildTimeline, TimelineEvent } from '../replay/timelineBuilder'
import { logger } from '../logger'
import { RcaGraphEngine } from './rcaGraphEngine'

export interface RcaReport {
  sessionId: string
  root_event: TimelineEvent | null
  failure_chain: TimelineEvent[]
  policy_triggers: TimelineEvent[]
  risk_peak: number
  causality_type: 'drift' | 'policy_violation' | 'risk_spike' | 'unknown'
}

export class RcaEngine {

  /**
   * Deprecated RCA entrypoint
   * Redirects analysis to RCA Graph Engine v2
   */
  static async analyzeIncident(sessionId: string): Promise<RcaReport | null> {

    logger.warn('RCA_ENGINE_V1_DEPRECATED', {
      sessionId,
      redirect: 'rcaGraphEngine.analyzeSession'
    })

    try {

      const graphResult = await RcaGraphEngine.analyzeSession(sessionId)

      if (!graphResult) return null

      // fallback minimal timeline for compatibility
      const timelineResult = await buildTimeline(sessionId)

      const timeline = timelineResult?.timeline || []
      const policyTriggers = timelineResult?.policyTriggers || []

      const rootEvent =
        timeline.length > 0
          ? timeline.find(e =>
              e.event_type === 'drift_alert' ||
              e.event_type === 'policy_violation' ||
              e.event_type === 'governance_escalation'
            ) || null
          : null

      const failureChain =
        rootEvent
          ? timeline.filter(e => new Date(e.timestamp) >= new Date(rootEvent.timestamp))
          : []

      const report: RcaReport = {
        sessionId,
        root_event: rootEvent,
        failure_chain: failureChain.slice(0, 10),
        policy_triggers: policyTriggers,
        risk_peak: Math.max(...timeline.map(e => e.risk_score || 0), 0),
        causality_type:
          graphResult.root_cause === 'model_drift'
            ? 'drift'
            : graphResult.root_cause === 'policy_non_compliance'
            ? 'policy_violation'
            : 'unknown'
      }

      logger.info('RCA_ENGINE_REDIRECTED_TO_GRAPH', {
        sessionId,
        rootCause: graphResult.root_cause,
        confidence: graphResult.confidence_score
      })

      return report

    } catch (err: any) {

      logger.error('RCA_ENGINE_WRAPPER_FAILURE', {
        sessionId,
        error: err.message
      })

      return null
    }
  }
}