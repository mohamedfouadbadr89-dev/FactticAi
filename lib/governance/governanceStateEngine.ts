import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { ModelDriftEngine } from '../intelligence/modelDriftEngine';
import { PredictiveDriftEngine } from '../intelligence/predictiveDriftEngine';
import { computeHallucinationRisk } from '../intelligence/hallucinationRisk';

export type GovernanceState = 'SAFE' | 'WATCH' | 'WARNING' | 'CRITICAL' | 'BLOCKED';

export interface GovernanceStateResponse {
  governance_state: GovernanceState;
  risk_score: number;
  contributing_factors: {
    drift: number;
    hallucination: number;
    policy: number;
    guardrail: number;
  };
}

/**
 * Stage 8.0: Governance State Engine
 * 
 * CORE RESPONSIBILITY: Deterministic risk orchestration.
 * Aggregates signals from intelligence engines to compute the final governance status.
 */
export class GovernanceStateEngine {
  
  /**
   * Aggregates signals and computes the final governance state for an organization.
   */
  static async getGovernanceState(orgId: string): Promise<GovernanceStateResponse> {
    try {
      // 1. Drift Signals (25% Weight)
      // Collects both historical model drift and predictive drift index.
      const driftReports = await ModelDriftEngine.computeDriftReports(orgId);
      const predictiveDrift = await PredictiveDriftEngine.computePredictiveDriftRisk(orgId, 'default');
      
      const avgModelDrift = driftReports.length > 0 
        ? driftReports.reduce((sum, r) => sum + r.latest.drift_score, 0) / driftReports.length 
        : 0;
      
      const predictiveScore = predictiveDrift?.drift_score || 0;
      const combinedDriftScore = (avgModelDrift + predictiveScore) / 2;
      const driftFactor = Math.round(combinedDriftScore * 0.25 * 10) / 10;

      // 2. Hallucination Risk (30% Weight)
      // Retrieves unified hallucination risk signal from cross-session patterns.
      const { data: latestSession } = await supabaseServer
        .from('sessions')
        .select('id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let hallucinationRisk = 0;
      if (latestSession) {
        const hSignal = await computeHallucinationRisk(latestSession.id);
        hallucinationRisk = hSignal?.riskScore || 0;
      }
      const hallucinationFactor = Math.round(hallucinationRisk * 0.30 * 10) / 10;

      // 3. Policy Violations (25% Weight)
      // Aggregates regression signals (tone shift, instruction following, etc) as policy proxies.
      const { data: regressionSignals } = await supabaseServer
        .from('regression_signals')
        .select('delta')
        .eq('org_id', orgId)
        .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const policyVulnerability = regressionSignals ? regressionSignals.reduce((sum, s) => sum + s.delta, 0) : 0;
      const policyScore = Math.min(100, policyVulnerability * 100);
      const policyFactor = Math.round(policyScore * 0.25 * 10) / 10;

      // 4. Guardrail Events (20% Weight)
      // Retrieves active runtime intercept risk scores.
      const { data: intercepts } = await supabaseServer
        .from('interceptor_events')
        .select('risk_score')
        .eq('org_id', orgId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const avgGuardrailRisk = (intercepts && intercepts.length > 0)
        ? intercepts.reduce((sum, i) => sum + i.risk_score, 0) / intercepts.length
        : 0;
      
      const guardrailFactor = Math.round(avgGuardrailRisk * 0.20 * 10) / 10;

      // 5. Final Synthesis
      const totalRiskScore = Math.min(100, Math.round(driftFactor + hallucinationFactor + policyFactor + guardrailFactor));

      // Deterministic State Classification
      let governance_state: GovernanceState = 'SAFE';
      if (totalRiskScore >= 90) governance_state = 'BLOCKED';
      else if (totalRiskScore >= 70) governance_state = 'CRITICAL';
      else if (totalRiskScore >= 45) governance_state = 'WARNING';
      else if (totalRiskScore >= 20) governance_state = 'WATCH';

      logger.info('GOVERNANCE_STATE_COMPUTED', { orgId, state: governance_state, score: totalRiskScore });

      return {
        governance_state,
        risk_score: totalRiskScore,
        contributing_factors: {
          drift: driftFactor,
          hallucination: hallucinationFactor,
          policy: policyFactor,
          guardrail: guardrailFactor
        }
      };

    } catch (err: any) {
      logger.error('GOVERNANCE_STATE_ENGINE_FAILURE', { orgId, error: err.message });
      throw err;
    }
  }
}
