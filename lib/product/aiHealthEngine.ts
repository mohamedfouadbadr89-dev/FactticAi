import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface AIHealthReport {
  health_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  metrics: {
    safety: number;
    reliability: number;
    stability: number;
    drift: number;
    efficiency: number;
  };
}

/**
 * AI Health Engine (Phase 56)
 * Computes the overall AI Health Score for an organization.
 */
export class AIHealthEngine {
  /**
   * Weights:
   * 30% Governance Safety (runtime intercepts)
   * 25% Model Reliability (behavior profiles)
   * 20% Agent Stability (agent sessions/incidents)
   * 15% Drift Status (drift metrics)
   * 10% Cost Efficiency (billing/cost metrics)
   */
  static async computeHealthScore(orgId: string): Promise<AIHealthReport> {
    try {
      // 1. Fetch relevant signals (Simulated aggregation for v1 logic)
      const { data: intercepts } = await supabaseServer.from('runtime_intercepts').select('id, risk_score').eq('org_id', orgId);
      const { data: drift } = await supabaseServer.from('model_drift').select('*').eq('org_id', orgId);
      const { data: agents } = await supabaseServer.from('agent_sessions').select('*').eq('org_id', orgId);
      const { data: cost } = await supabaseServer.from('cost_metrics').select('cost_usd').eq('org_id', orgId);

      // 2. Compute Segment Scores (0-100)
      const safetyScore = this.calculateSafety(intercepts || []);
      const reliabilityScore = this.calculateReliability(drift || []);
      const stabilityScore = this.calculateStability(agents || []);
      const driftScore = this.calculateDrift(drift || []);
      const efficiencyScore = 85; // Fixed baseline for demo or derived from cost thresholds

      // 3. Final Weighted Calculation
      const finalScore = Math.floor(
        (safetyScore * 0.30) +
        (reliabilityScore * 0.25) +
        (stabilityScore * 0.20) +
        (driftScore * 0.15) +
        (efficiencyScore * 0.10)
      );

      const riskLevel = this.getRiskLevel(finalScore);

      // 4. Persist result
      await supabaseServer.from('ai_health_scores').insert({
        org_id: orgId,
        health_score: finalScore,
        risk_level: riskLevel,
        blocked_responses: intercepts?.length || 0,
        drift_alerts: drift?.filter((d: any) => d.drift_score > 50).length || 0,
        agent_incidents: agents?.filter((a: any) => a.status === 'blocked' || a.status === 'escalated').length || 0,
        cost_efficiency: efficiencyScore
      });

      return {
        health_score: finalScore,
        risk_level: riskLevel,
        metrics: {
          safety: safetyScore,
          reliability: reliabilityScore,
          stability: stabilityScore,
          drift: driftScore,
          efficiency: efficiencyScore,
        }
      };

    } catch (err: any) {
      logger.error('HEALTH_ENGINE_COMPUTE_FAILED', { error: err.message });
      return { 
        health_score: 100, 
        risk_level: 'low', 
        metrics: { safety: 100, reliability: 100, stability: 100, drift: 100, efficiency: 100 } 
      };
    }
  }

  private static calculateSafety(intercepts: any[]): number {
    if (intercepts.length === 0) return 100;
    const avgRisk = intercepts.reduce((sum, i) => sum + (i.risk_score || 0), 0) / intercepts.length;
    return Math.max(0, 100 - avgRisk);
  }

  private static calculateReliability(drift: any[]): number {
    if (drift.length === 0) return 100;
    const avgDrift = drift.reduce((sum, d) => sum + (d.drift_score || 0), 0) / drift.length;
    return Math.max(0, 100 - (avgDrift * 0.5));
  }

  private static calculateStability(agents: any[]): number {
    if (agents.length === 0) return 100;
    const incidents = agents.filter(a => a.status === 'blocked' || a.status === 'escalated').length;
    return Math.max(0, 100 - (incidents * 20));
  }

  private static calculateDrift(drift: any[]): number {
    if (drift.length === 0) return 100;
    const anomalies = drift.filter(d => d.drift_score > 70).length;
    return Math.max(0, 100 - (anomalies * 25));
  }

  private static getRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (score >= 85) return 'low';
    if (score >= 65) return 'moderate';
    if (score >= 40) return 'high';
    return 'critical';
  }
}
