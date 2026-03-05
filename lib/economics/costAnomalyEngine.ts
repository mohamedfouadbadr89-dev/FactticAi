import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface CostAnomaly {
  id?: string;
  org_id: string;
  model_name: string;
  token_spike_ratio: number;
  baseline_tokens: number;
  observed_tokens: number;
  detected_at: string;
  resolved: boolean;
}

/**
 * Cost Anomaly Detection Engine
 * 
 * CORE PRINCIPLE: Detect abnormal spikes in token consumption using 7-day rolling baselines.
 */
export class CostAnomalyEngine {
  private static SPIKE_THRESHOLD = 2.5; // 250% of baseline

  /**
   * Scans for cost/token anomalies in an organization.
   */
  static async detectAnomalies(orgId: string): Promise<CostAnomaly[]> {
    logger.info('COST_ANOMALY_SCAN_STARTED', { orgId });
    
    const detected: CostAnomaly[] = [];

    try {
      // 1. Get unique models for this org from cost_metrics
      const { data: models, error: modelsError } = await supabaseServer
        .from('cost_metrics')
        .select('model_name')
        .eq('org_id', orgId);

      if (modelsError || !models) throw modelsError || new Error('No models found');
      
      const uniqueModels = Array.from(new Set(models.map(m => m.model_name)));

      for (const model of uniqueModels) {
        // 2. Compute 7-day rolling average (baseline)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: metrics, error: metricsError } = await supabaseServer
          .from('cost_metrics')
          .select('token_usage, created_at')
          .eq('org_id', orgId)
          .eq('model_name', model)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (metricsError || !metrics || metrics.length < 2) continue;

        // Latest observed usage
        const observed = Number(metrics[0].token_usage);
        
        // Baseline = Average of the other points in the 7-day window
        const baselineData = metrics.slice(1);
        const baseline = baselineData.reduce((acc, curr) => acc + Number(curr.token_usage), 0) / baselineData.length;

        if (baseline === 0) continue;

        const spikeRatio = observed / baseline;

        // 3. Detect Anomaly
        if (spikeRatio > this.SPIKE_THRESHOLD) {
          logger.warn('COST_ANOMALY_DETECTED', { orgId, model, spikeRatio });

          const anomaly: CostAnomaly = {
            org_id: orgId,
            model_name: model,
            token_spike_ratio: spikeRatio,
            baseline_tokens: baseline,
            observed_tokens: observed,
            detected_at: new Date().toISOString(),
            resolved: false
          };

          // Record anomaly
          const { error: insertError } = await supabaseServer
            .from('cost_anomalies')
            .insert(anomaly);

          if (insertError) {
            logger.error('COST_ANOMALY_INSERT_FAILED', { error: insertError.message });
          } else {
            detected.push(anomaly);
          }
        }
      }

      return detected;

    } catch (error: any) {
      logger.error('COST_ANOMALY_ENGINE_ERROR', { orgId, error: error.message });
      return [];
    }
  }

  /**
   * Retrieves current active anomalies for an organization.
   */
  static async getAnomalies(orgId: string): Promise<CostAnomaly[]> {
    const { data, error } = await supabaseServer
      .from('cost_anomalies')
      .select('*')
      .eq('org_id', orgId)
      .eq('resolved', false)
      .order('detected_at', { ascending: false });

    if (error) {
      logger.error('COST_ANOMALY_FETCH_FAILED', { orgId, error: error.message });
      return [];
    }

    return data as CostAnomaly[];
  }
}
