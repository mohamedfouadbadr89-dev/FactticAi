import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';
import { TurnRiskScore } from '@/lib/riskTypes';

export interface AlertConfig {
  id: string;
  org_id: string;
  name: string;
  metric: 'total_risk' | 'confidence' | 'drift_pct';
  condition: {
    operator: '>' | '<' | '=';
    threshold: number;
    duration?: number; // Minutes
  };
  channels: string[]; // ['email', 'slack', 'pagerduty']
  is_active: boolean;
  snooze_until?: string;
}

export class AlertEngine {
  /**
   * Evaluates a single evaluation result against all active alert configs for an organization.
   */
  static async evaluateEvaluation(orgId: string, evaluation: TurnRiskScore) {
    try {
      const { data: configs, error } = await supabaseServer
        .from('alert_configs')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true);

      if (error) throw error;
      if (!configs || configs.length === 0) return;

      for (const config of (configs as AlertConfig[])) {
        if (config.snooze_until && new Date(config.snooze_until) > new Date()) {
          continue;
        }

        const value = evaluation[config.metric as keyof TurnRiskScore];
        if (typeof value !== 'number') continue;

        if (this.checkCondition(value, config.condition)) {
          await this.triggerAlert(config, evaluation);
        }
      }
    } catch (err: any) {
      logger.error('ALERT_EVALUATION_FAILED', { orgId, error: err.message });
    }
  }

  /**
   * Core logic for checking alert conditions.
   */
  private static checkCondition(value: number, condition: AlertConfig['condition']): boolean {
    const { operator, threshold } = condition;
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '=': return value === threshold;
      default: return false;
    }
  }

  /**
   * Mock implementation for triggering notifications.
   */
  private static async triggerAlert(config: AlertConfig, evaluation: TurnRiskScore) {
    logger.warn('ALERT_TRIGGERED', {
      alert_id: config.id,
      name: config.name,
      org_id: config.org_id,
      metric: config.metric,
      channels: config.channels
    });

    // In a production environment, this would call specialized notification microservices
    for (const channel of config.channels) {
      switch (channel) {
        case 'email':
          logger.info('EXTERNAL_NOTIFICATION_SENDING', { channel: 'email', to: 'admin@facttic.ai' });
          break;
        case 'slack':
          logger.info('EXTERNAL_NOTIFICATION_SENDING', { channel: 'slack', webhook: 'https://hooks.slack.com/...' });
          break;
        case 'pagerduty':
          logger.info('EXTERNAL_NOTIFICATION_SENDING', { channel: 'pagerduty', service_key: '...' });
          break;
      }
    }

    // Record the alert incident in the database
    // For now, we reuse the drift_alerts table or create a dedicated incident log
    const { error } = await supabaseServer
      .from('drift_alerts')
      .insert({
        org_id: config.org_id,
        severity: evaluation.total_risk > 0.8 ? 'critical' : 'elevated',
        triggered_by: `Alert Rule: ${config.name}`,
        description: `Threshold breached on ${config.metric}: ${evaluation[config.metric as keyof TurnRiskScore]} (Target: ${config.condition.operator}${config.condition.threshold})`,
        metadata: {
          alert_config_id: config.id,
          evaluation_data: evaluation
        }
      });

    if (error) {
      logger.error('ALERT_INCIDENT_RECORDING_FAILED', { error: error.message });
    }
  }
}
