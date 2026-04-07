import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { WebhookDispatcher } from '../webhookDispatcher';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertTrigger {
  org_id: string;
  alert_type: string;
  severity: AlertSeverity;
  metadata?: Record<string, any>;
}

/**
 * Governance Alert Engine (v1.0)
 * 
 * CORE RESPONSIBILITY: Asynchronous alert generation for critical 
 * governance events (risk breaches, policy blocks, drift, etc).
 */
export class GovernanceAlertEngine {

  /**
   * Generates a governance alert asynchronously.
   * This method never blocks the caller.
   */
  static triggerAlert(trigger: AlertTrigger): void {
    // ASYNC PATH: Execute immediately without awaiting
    setImmediate(async () => {
      try {
        const { org_id, alert_type, severity, metadata } = trigger;

        const { error } = await supabaseServer
          .from('governance_alerts')
          .insert({
            org_id,
            alert_type,
            severity,
            metadata: metadata || {}
          });

        if (error) throw error;

        logger.info('GOVERNANCE_ALERT_GENERATED', {
          org_id,
          type: alert_type,
          severity
        });

        // Dispatch to customer webhook endpoints (fire-and-forget)
        WebhookDispatcher.dispatch({
          event: alert_type,
          org_id,
          severity,
          metadata: metadata || {},
          triggered_at: new Date().toISOString(),
        });

      } catch (err: any) {
        logger.error('GOVERNANCE_ALERT_FAILED', { 
          error: err.message, 
          trigger 
        });
      }
    });
  }

  /**
   * Centralized evaluation hook (v1.0)
   * Evaluates all governance signals and triggers alerts if thresholds are exceeded.
   */
  static evaluate(params: {
    org_id: string;
    session_id?: string | undefined;
    risk_score: number;
    policy_action?: string | undefined;
    drift_score?: number | undefined;
    cost_spike_ratio?: number | undefined;
    metadata?: any;
  }): void {
    const { org_id, session_id, risk_score, policy_action, drift_score, cost_spike_ratio, metadata } = params;

    // 1. Risk Score Check
    if (risk_score > 75) {
      this.triggerAlert({
        org_id,
        alert_type: 'RISK_SCORE_CRITICAL',
        severity: 'critical',
        metadata: { ...metadata, risk_score, session_id }
      });
    }

    // 2. Policy Violation Check
    if (policy_action === 'block') {
      this.triggerAlert({
        org_id,
        alert_type: 'POLICY_VIOLATION_BLOCK',
        severity: 'critical',
        metadata: { ...metadata, policy_action, session_id }
      });
    }

    // 3. Predictive Drift Check (Critical Level: 65)
    if (drift_score && drift_score > 65) {
      this.triggerAlert({
        org_id,
        alert_type: 'PREDICTIVE_DRIFT_CRITICAL',
        severity: 'warning',
        metadata: { ...metadata, drift_score, session_id }
      });
    }

    // 4. Cost Spike Check
    if (cost_spike_ratio && cost_spike_ratio > 3) {
      this.triggerAlert({
        org_id,
        alert_type: 'COST_SPIKE_RATIO_EXCEEDED',
        severity: 'critical',
        metadata: { ...metadata, cost_spike_ratio, session_id }
      });
    }
  }

  /**
   * High-level trigger for risk score breaches.
   */
  static checkRiskScore(orgId: string, score: number, breakdown?: any) {
    if (score > 75) {
      this.triggerAlert({
        org_id: orgId,
        alert_type: 'RISK_SCORE_CRITICAL',
        severity: 'critical',
        metadata: { score, breakdown }
      });
    }
  }

  /**
   * High-level trigger for policy blocks.
   */
  static notifyPolicyBlock(orgId: string, policyName: string, reason: string) {
    this.triggerAlert({
      org_id: orgId,
      alert_type: 'POLICY_VIOLATION_BLOCK',
      severity: 'critical',
      metadata: { policy_name: policyName, reason }
    });
  }

  /**
   * High-level trigger for predictive drift.
   */
  static notifyDriftCritical(orgId: string, model: string, driftScore: number) {
    this.triggerAlert({
      org_id: orgId,
      alert_type: 'PREDICTIVE_DRIFT_CRITICAL',
      severity: 'warning',
      metadata: { model, drift_score: driftScore }
    });
  }

  /**
   * High-level trigger for cost spikes.
   */
  static notifyCostSpike(orgId: string, ratio: number, actual: number, baseline: number) {
    if (ratio > 3) {
      this.triggerAlert({
        org_id: orgId,
        alert_type: 'COST_SPIKE_RATIO_EXCEEDED',
        severity: 'critical',
        metadata: { ratio, actual, baseline }
      });
    }
  }
}
