import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export type AutonomousActionType = 'reduce_temp' | 'switch_provider' | 'block' | 'review' | 'redact';

export interface AutonomousDecision {
  trigger: string;
  action: AutonomousActionType;
  confidence: number;
  reason: string;
}

/**
 * Autonomous Governor Engine (Phase 52)
 * Detects risks and automatically executes governance actions.
 */
export class AutonomousGovernor {
  /**
   * Evaluates risks and decides on autonomous action.
   */
  static async evaluateAndRun(orgId: string, context: { 
    risk_score: number, 
    signals: any, 
    model: string, 
    session_id?: string 
  }): Promise<AutonomousDecision | null> {
    try {
      let decision: AutonomousDecision | null = null;

      // 1. Logic: Severe Hallucination / High Risk -> Block
      if (context.risk_score > 85) {
        decision = {
          trigger: 'CRITICAL_RISK_THRESHOLD',
          action: 'block',
          confidence: 98,
          reason: `Risk score (${context.risk_score}) exceeds critical threshold of 85.`
        };
      }
      // 2. Logic: PII Detected -> Redact (Autonomous)
      else if (context.signals?.pii_score > 60) {
        decision = {
          trigger: 'PII_EXPOSURE_DETECTED',
          action: 'redact',
          confidence: 92,
          reason: 'High confidence PII detection triggering autonomous redaction.'
        };
      }
      // 3. Logic: Model Drift / Repeated Low Quality -> Switch Provider
      else if (context.risk_score > 60 && context.model.includes('experimental')) {
        decision = {
          trigger: 'EXPERIMENTAL_MODEL_DRIFT',
          action: 'switch_provider',
          confidence: 85,
          reason: 'Automated fallback to stable provider due to experimental model instability.'
        };
      }

      if (decision) {
        await this.logAction(orgId, decision, context);
        // In a real system, this would call actual orchestration APIs to execute the change
        logger.info('AUTONOMOUS_GOVERNANCE_ACTION_EXECUTED', { orgId, ...decision });
      }

      return decision;
    } catch (err: any) {
      logger.error('AUTONOMOUS_GOVERNOR_EVALUATION_FAILED', { error: err.message, orgId });
      throw err;
    }
  }

  private static async logAction(orgId: string, decision: AutonomousDecision, context: any) {
    await supabaseServer.from('autonomous_actions').insert({
      org_id: orgId,
      trigger: decision.trigger,
      action: decision.action,
      confidence: decision.confidence,
      payload: {
        reason: decision.reason,
        session_id: context.session_id,
        original_model: context.model,
        risk_score: context.risk_score
      }
    });
  }

  /**
   * Seed demo autonomous actions for the dashboard.
   */
  static async seedDemoActions(orgId: string) {
    const actions: AutonomousActionType[] = ['block', 'switch_provider', 'redact', 'reduce_temp'];
    const triggers = ['STOCHASTIC_DRIFT_DETECTED', 'PII_LEAK_PREVENTION', 'ADVERSARIAL_PROMPT_BLOCK', 'MODEL_LATENCY_SPIKE'];
    
    const records = [];
    for (let i = 0; i < 15; i++) {
      const idx = Math.floor(Math.random() * actions.length);
      records.push({
        org_id: orgId,
        trigger: triggers[idx],
        action: actions[idx],
        confidence: 75 + (Math.random() * 24),
        payload: {
          reason: `System-generated autonomous response to ${triggers[idx].toLowerCase().replace(/_/g, ' ')}.`,
          session_id: `auton-svc-${Math.random().toString(36).slice(2, 10)}`,
          risk_score: 50 + (Math.random() * 45)
        },
        created_at: new Date(Date.now() - (i * 2 * 3600000)).toISOString()
      });
    }

    await supabaseServer.from('autonomous_actions').insert(records);
    return { count: records.length };
  }
}
