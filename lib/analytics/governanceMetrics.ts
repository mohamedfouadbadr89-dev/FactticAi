import { supabaseServer } from '../supabaseServer';

/**
 * Governance Analytics Engine
 * 
 * Aggregates telemetry from the forensic ledger for Control Center visualization.
 */
export const GovernanceAnalytics = {
  
  /**
   * Session Risk Aggregation
   * Calculates the average risk score for real traffic in the last hour.
   */
  async getSessionRisk(orgId: string) {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('risk_score')
      .eq('org_id', orgId)
      .is('simulation_id', null)
      .gt('timestamp', oneHourAgo);

    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    const sum = data.reduce((acc, row) => acc + (row.risk_score || 0), 0);
    return Math.round(sum / data.length);
  },

  /**
   * Simulation Activity Tracker
   * Counts active simulation events and intensity in the last hour.
   */
  async getSimulationActivity(orgId: string) {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('risk_score, scenario_type, timestamp, decision')
      .eq('org_id', orgId)
      .not('simulation_id', 'is', null)
      .gt('timestamp', oneHourAgo);

    if (error) throw error;

    const runs = data?.map(row => ({
      risk_score: row.risk_score,
      scenario_name: row.scenario_type || 'Synthetic Attack',
      executed_at: row.timestamp,
      decision: row.decision
    })) || [];

    return {
      count: runs.length,
      runs
    };
  },

  /**
   * Governance Health Index
   * Computes a composite health score: 100 - (avg_risk).
   */
  async getGovernanceHealth(orgId: string) {
    const avgRisk = await this.getSessionRisk(orgId);
    return Math.max(0, 100 - avgRisk);
  }
};
