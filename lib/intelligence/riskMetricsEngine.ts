import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { GuardrailEngine } from '../governance/guardrailEngine';
import { PredictiveDriftEngine } from './predictiveDriftEngine';
import { BehaviorForensicsEngine } from '../forensics/behaviorForensicsEngine';
import { CostAnomalyEngine } from '../economics/costAnomalyEngine';

export interface RiskBreakdown {
  guardrail_risk: number;
  drift_risk: number;
  behavior_risk: number;
  cost_risk: number;
}

export interface RiskMetricResult {
  risk_score: number;
  breakdown: RiskBreakdown;
  timestamp: string;
}

/**
 * Risk Metrics Aggregation Engine (v1.0)
 * 
 * CORE RESPONSIBILITY: Synthesize distributed governance signals into 
 * a unified organizational risk score using weighted calculation.
 */
export class RiskMetricsEngine {
  
  // Weighted calculation constants
  private static WEIGHTS = {
    GUARDRAIL: 0.35,
    DRIFT: 0.25,
    BEHAVIOR: 0.25,
    COST: 0.15
  };

  /**
   * Aggregates signals and computes the final risk score.
   */
  static async calculateRiskScore(orgId: string, sessionId?: string): Promise<RiskMetricResult> {
    try {
      logger.info('RISK_AGGREGATION_STARTED', { orgId, sessionId });

      // 1. Parallel Signal Acquisition
      // Note: We fetch latest available signals or compute them if necessary
      const [driftSignal, behaviorSignal, costAnomalies] = await Promise.all([
        // Predictive Drift utilizes historical model drift metrics
        PredictiveDriftEngine.computePredictiveDriftRisk(orgId, 'default'), // Using a 'default' model tag for org-wide risk if no specific model
        sessionId ? BehaviorForensicsEngine.analyzeSession(sessionId) : null,
        CostAnomalyEngine.getAnomalies(orgId)
      ]);

      // 2. Normalize and Extract Component Risks (0-100 scale)
      
      // Guardrail Risk: Fetch from latest intercepts if no sessionId provided
      let guardrail_risk = 0;
      if (sessionId) {
        const { data: intercept } = await supabaseServer
          .from('interceptor_events')
          .select('risk_score')
          .eq('session_id', sessionId)
          .maybeSingle();
        guardrail_risk = intercept?.risk_score || 0;
      } else {
        const { data: latestIntercepts } = await supabaseServer
          .from('interceptor_events')
          .select('risk_score')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        guardrail_risk = latestIntercepts && latestIntercepts.length > 0
          ? latestIntercepts.reduce((sum, i) => sum + Number(i.risk_score), 0) / latestIntercepts.length
          : 0;
      }

      // Drift Risk
      const drift_risk = driftSignal?.drift_score || 0;

      // Behavior Risk
      const behavior_risk = behaviorSignal?.intent_drift_score || 0;

      // Cost Risk: Penalty based on number of active anomalies (20 points per anomaly, capped at 100)
      const cost_risk = Math.min(100, (costAnomalies?.length || 0) * 20);

      // 3. Weighted Aggregation
      const risk_score = Math.round(
        (guardrail_risk * this.WEIGHTS.GUARDRAIL) +
        (drift_risk * this.WEIGHTS.DRIFT) +
        (behavior_risk * this.WEIGHTS.BEHAVIOR) +
        (cost_risk * this.WEIGHTS.COST)
      );

      const breakdown: RiskBreakdown = {
        guardrail_risk: Math.round(guardrail_risk),
        drift_risk: Math.round(drift_risk),
        behavior_risk: Math.round(behavior_risk),
        cost_risk: Math.round(cost_risk)
      };

      const result: RiskMetricResult = {
        risk_score,
        breakdown,
        timestamp: new Date().toISOString()
      };

      // 4. Persistence
      await supabaseServer.from('governance_risk_metrics').insert({
        org_id: orgId,
        session_id: sessionId || null,
        risk_score: result.risk_score,
        signals_json: result.breakdown
      });

      logger.info('RISK_AGGREGATION_COMPLETE', { orgId, risk_score: result.risk_score });
      return result;

    } catch (err: any) {
      logger.error('RISK_AGGREGATION_FAILURE', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Retrieves the latest risk score for an organization.
   */
  static async getLatestScore(orgId: string): Promise<RiskMetricResult | null> {
    const { data, error } = await supabaseServer
      .from('governance_risk_metrics')
      .select('risk_score, signals_json, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      risk_score: data.risk_score,
      breakdown: data.signals_json as unknown as RiskBreakdown,
      timestamp: data.created_at
    };
  }
}
