import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export type AlertSeverity = 'low' | 'medium' | 'critical';

export interface AlertSignal {
  orgId: string;
  type: string;
  severity?: AlertSeverity;
  message: string;
  risk_score?: number;
  metadata?: any;
}

/**
 * Alert Notification Engine
 * 
 * CORE PRINCIPLE: Classify and persist governance alerts for institutional visibility.
 */
export class AlertEngine {
  /**
   * Triggers a new governance alert based on a risk signal.
   */
  static async triggerAlert(signal: AlertSignal): Promise<void> {
    try {
      const severity = signal.severity || this.classifySeverity(signal.risk_score || 0);

      const { error } = await supabaseServer
        .from('alerts')
        .insert({
          org_id: signal.orgId,
          alert_type: signal.type,
          severity: severity,
          message: signal.message,
          metadata: signal.metadata || {}
        });

      if (error) {
        logger.error('ALERT_PERSISTENCE_FAILED', { orgId: signal.orgId, error: error.message });
        return;
      }

      logger.info('GOVERNANCE_ALERT_TRIGGERED', { orgId: signal.orgId, type: signal.type, severity });

      // Automation: Critial alerts could trigger external webhooks or emails in a real system
      if (severity === 'critical') {
        this.escalateCriticalAlert(signal);
      }

    } catch (err: any) {
      logger.error('ALERT_ENGINE_ERROR', { error: err.message });
    }
  }

  /**
   * Helper to classify severity based on risk metrics.
   */
  private static classifySeverity(riskScore: number): AlertSeverity {
    if (riskScore >= 0.7) return 'critical';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  private static escalateCriticalAlert(signal: AlertSignal) {
    logger.warn('PRI_CRITICAL: Automated escalation triggered for governance breach.', { 
      orgId: signal.orgId, 
      type: signal.type 
    });
  }
}
