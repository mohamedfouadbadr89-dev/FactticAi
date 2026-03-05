import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface MaturityScore {
  policy_coverage: number;
  risk_stability: number;
  incident_response_score: number;
  maturity_score: number;
}

/**
 * Governance Maturity Engine
 * 
 * CORE RESPONSIBILITY: Calculate organizational governance maturity by 
 * aggregating performance across policy, risk, and incident dimensions.
 */
export class GovernanceMaturityEngine {

  /**
   * Calculates and persists the maturity score for an organization.
   */
  static async calculateMaturity(orgId: string): Promise<MaturityScore> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 60 * 60 * 24 * 1000).toISOString();

      // 1. Policy Coverage Analysis
      const [
        { data: policies },
        { count: sessionCount }
      ] = await Promise.all([
        supabaseServer.from('governance_policies').select('id').eq('org_id', orgId),
        supabaseServer.from('sessions').select('id', { count: 'exact', head: true }).eq('org_id', orgId)
      ]);

      const policyCount = policies?.length || 0;
      // Heuristic: 10 policies = 100% coverage for standard high-trust orgs
      const policyCoverage = Math.min(100, (policyCount / 10) * 100);

      // 2. Risk Stability Analysis (Inverse Variance)
      const { data: sessions } = await supabaseServer
        .from('sessions')
        .select('total_risk')
        .eq('org_id', orgId)
        .gte('created_at', thirtyDaysAgo)
        .limit(100);

      let riskStability = 100;
      if (sessions && sessions.length > 1) {
        const risks = sessions.map(s => Number(s.total_risk));
        const mean = risks.reduce((a, b) => a + b, 0) / risks.length;
        const variance = risks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / risks.length;
        // Higher stability if variance is low (0.1 threshold for 0 score)
        riskStability = Math.max(0, 100 - (variance * 1000));
      }

      // 3. Incident Response Score
      const { data: alerts } = await supabaseServer
        .from('drift_alerts')
        .select('lifecycle_status')
        .eq('org_id', orgId)
        .gte('created_at', thirtyDaysAgo);

      let incidentScore = 100;
      if (alerts && alerts.length > 0) {
        const resolvedCount = alerts.filter(a => a.lifecycle_status === 'resolved' || a.lifecycle_status === 'closed').length;
        incidentScore = (resolvedCount / alerts.length) * 100;
      }

      // 4. Weighted Maturity Calculation
      const maturityScore = Math.round(
        (policyCoverage * 0.3) + 
        (riskStability * 0.4) + 
        (incidentScore * 0.3)
      );

      const result: MaturityScore = {
        policy_coverage: Math.round(policyCoverage),
        risk_stability: Math.round(riskStability),
        incident_response_score: Math.round(incidentScore),
        maturity_score: maturityScore
      };

      // 5. Persistence
      const { error: persistError } = await supabaseServer
        .from('governance_maturity_scores')
        .insert({
          org_id: orgId,
          ...result
        });

      if (persistError) throw persistError;

      logger.info('GOVERNANCE_MATURITY_CALCULATED', { orgId, ...result });
      return result;

    } catch (err: any) {
      logger.error('MATURITY_CALCULATION_FAILURE', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Retrieves historical maturity scores for an organization.
   */
  static async getMaturityHistory(orgId: string) {
    const { data, error } = await supabaseServer
      .from('governance_maturity_scores')
      .select('*')
      .eq('org_id', orgId)
      .order('calculated_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  }
}
