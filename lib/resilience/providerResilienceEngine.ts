import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface ProviderHealth {
  provider: string;
  latency: number;
  error_rate: number;
  health_score: number;
  state: 'HEALTHY' | 'DEGRADED' | 'DOWN';
}

/**
 * Provider Resilience Engine
 * 
 * CORE RESPONSIBILITY: Detect provider instability and enable automated failover.
 */
export class ProviderResilienceEngine {
  
  private static PROVIDERS = ['openai', 'anthropic', 'google'];
  
  /**
   * Records a health metric for a provider.
   */
  static async recordMetric(provider: string, latency: number, isError: boolean) {
    try {
      // Simple moving average simulation/calculation
      const errorVal = isError ? 1 : 0;
      const healthScore = this.calculateHealthScore(latency, errorVal);

      const { error } = await supabaseServer
        .from('provider_health')
        .insert({
          provider,
          latency,
          error_rate: errorVal,
          health_score: healthScore
        });

      if (error) throw error;

    } catch (err: any) {
      logger.error('PROVIDER_METRIC_RECORD_FAILED', { provider, error: err.message });
    }
  }

  /**
   * Returns current health scores and states for all providers.
   */
  static async getProviderStatus(): Promise<ProviderHealth[]> {
    try {
      const { data, error } = await supabaseServer
        .from('provider_health')
        .select('*')
        .order('measured_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      return this.PROVIDERS.map(p => {
        const providerData = data?.filter(d => d.provider === p) || [];
        const avgLatency = providerData.length > 0 
          ? providerData.reduce((acc, d) => acc + d.latency, 0) / providerData.length 
          : 500;
        const avgError = providerData.length > 0
          ? providerData.reduce((acc, d) => acc + d.error_rate, 0) / providerData.length
          : 0;
        
        const healthScore = this.calculateHealthScore(avgLatency, avgError);
        
        let state: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'HEALTHY';
        if (avgError > 0.2 || healthScore < 50) state = 'DOWN';
        else if (avgError > 0.05 || healthScore < 80) state = 'DEGRADED';

        return {
          provider: p,
          latency: avgLatency,
          error_rate: avgError,
          health_score: healthScore,
          state
        };
      });

    } catch (err: any) {
      logger.error('GET_PROVIDER_STATUS_FAILED', { error: err.message });
      return [];
    }
  }

  /**
   * Recommends a fallback provider if the primary is unstable.
   */
  static async recommendFallback(primaryProvider: string): Promise<string | null> {
    const statuses = await this.getProviderStatus();
    const primaryStatus = statuses.find(s => s.provider === primaryProvider);

    if (!primaryStatus || primaryStatus.state === 'HEALTHY') {
      return null; // No fallback needed
    }

    // Sort remainders by health score descending
    const candidates = statuses
      .filter(s => s.provider !== primaryProvider && s.state === 'HEALTHY')
      .sort((a, b) => b.health_score - a.health_score);

    return candidates[0]?.provider || null;
  }

  private static calculateHealthScore(latency: number, errorRate: number): number {
    // 100 base score
    // -1 point for every 20ms over 200ms
    // -100 points if error rate is 1
    const latencyPenalty = Math.max(0, (latency - 200) / 20);
    const errorPenalty = errorRate * 100;
    
    return Math.max(0, Math.min(100, 100 - latencyPenalty - errorPenalty));
  }
}
