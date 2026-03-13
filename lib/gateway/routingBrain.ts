import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export type RoutingMode = 'auto' | 'balanced' | 'cost_optimized' | 'risk_optimized' | 'latency_optimized';

export interface RoutingDecision {
  selected_model: string;
  provider: string;
  routing_score: number;
}

export interface ModelMetric {
  model_name: string;
  provider: string;
  avg_latency: number;
  avg_cost: number;
  risk_score: number;
  reliability_score: number;
}

/**
 * Multi-Provider AI Routing Brain (Phase 54)
 * Selects the best AI provider for each request based on a weighted formula.
 */
export class RoutingBrain {
  /**
   * Selects the optimal model and provider based on the specified mode.
   */
  static async selectModel(mode: RoutingMode = 'auto', context?: any): Promise<RoutingDecision> {
    try {
      const { data: metrics, error } = await supabaseServer
        .from('routing_metrics')
        .select('*');

      if (error || !metrics || metrics.length === 0) {
        // Fallback to static selection if no metrics found
        return {
          selected_model: 'gpt-4o',
          provider: 'openai',
          routing_score: 50
        };
      }

      const weights = this.getWeights(mode);
      
      let bestModel: RoutingDecision | null = null;
      let lowestScore = Infinity;

      for (const metric of metrics as ModelMetric[]) {
        const score = this.calculateScore(metric, weights);
        
        if (score < lowestScore) {
          lowestScore = score;
          bestModel = {
            selected_model: metric.model_name,
            provider: metric.provider,
            routing_score: score
          };
        }
      }

      if (!bestModel) throw new Error('NO_SUITABLE_MODEL_FOUND');

      logger.info('AI_ROUTING_DECISION_MADE', { mode, ...bestModel });
      return bestModel;

    } catch (err: any) {
      logger.error('ROUTING_BRAIN_FAILED', { error: err.message, mode });
      // Critical fallback
      return {
        selected_model: 'gpt-4o',
        provider: 'openai',
        routing_score: 100
      };
    }
  }

  /**
   * Weights: 40% Reliability, 30% Risk, 20% Latency, 10% Cost
   * We normalize these based on the routing mode.
   */
  /**
   * Records execution feedback to update routing metrics in real-time.
   */
  static async recordFeedback(model: string, provider: string, metrics: { latency: number, risk_score: number }) {
    try {
      // Logic: If risk is high, penalize reliability
      const reliabilityPenalization = metrics.risk_score > 50 ? (metrics.risk_score / 10) : 0;
      
      const { data: existing } = await supabaseServer
        .from('routing_metrics')
        .select('*')
        .eq('model_name', model)
        .eq('provider', provider)
        .single();

      if (existing) {
        const newReliability = Math.max(0, existing.reliability_score - reliabilityPenalization);
        const newRisk = (existing.risk_score + metrics.risk_score) / 2;
        const newLatency = (existing.avg_latency + metrics.latency) / 2;

        await supabaseServer
          .from('routing_metrics')
          .update({
            reliability_score: newReliability,
            risk_score: newRisk,
            avg_latency: newLatency,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);
      }
    } catch (err: any) {
      logger.error('ROUTING_FEEDBACK_FAILED', { error: err.message });
    }
  }

  private static getWeights(mode: RoutingMode) {
    const base = { reliability: 0.4, risk: 0.3, latency: 0.2, cost: 0.1 };

    switch (mode) {
      case 'cost_optimized':
        return { reliability: 0.2, risk: 0.1, latency: 0.1, cost: 0.6 };
      case 'risk_optimized':
        return { reliability: 0.3, risk: 0.5, latency: 0.1, cost: 0.1 };
      case 'latency_optimized':
        return { reliability: 0.2, risk: 0.1, latency: 0.6, cost: 0.1 };
      case 'balanced':
      case 'auto':
      default:
        return base;
    }
  }

  /**
   * Lower score is better.
   * Logic: 
   * - High reliability (e.g. 100) -> Lower contribution to score (100 - val)
   * - High risk -> Higher contribution
   * - High latency -> Higher contribution
   * - High cost -> Higher contribution
   */
  private static calculateScore(metric: ModelMetric, weights: any): number {
    // Normalizing values (0-100 range expected for simplicity in comparison)
    const reliabilityPart = (100 - metric.reliability_score) * weights.reliability;
    const riskPart = metric.risk_score * weights.risk;
    const latencyPart = (metric.avg_latency / 50) * weights.latency; // Assume 5s (5000ms) = 100 score points
    const costPart = (metric.avg_cost * 1000) * weights.cost; // Assume $0.1 per token = high cost

    return reliabilityPart + riskPart + latencyPart + costPart;
  }

  /**
   * Seed demo metrics for routing brain testing and dashboard.
   */
  static async seedRoutingMetrics() {
    const data = [
      { model_name: 'gpt-4o', provider: 'openai', avg_latency: 800, avg_cost: 0.005, risk_score: 10, reliability_score: 99 },
      { model_name: 'claude-3-5-sonnet', provider: 'anthropic', avg_latency: 1200, avg_cost: 0.003, risk_score: 8, reliability_score: 98 },
      { model_name: 'gemini-1.5-pro', provider: 'google', avg_latency: 1500, avg_cost: 0.002, risk_score: 15, reliability_score: 95 },
      { model_name: 'mistral-large', provider: 'mistral', avg_latency: 900, avg_cost: 0.004, risk_score: 12, reliability_score: 94 },
      { model_name: 'llama-3-70b', provider: 'local_llm', avg_latency: 400, avg_cost: 0.0001, risk_score: 25, reliability_score: 88 }
    ];

    await supabaseServer.from('routing_metrics').upsert(data, { onConflict: 'model_name,provider' });
    return { count: data.length };
  }
}
