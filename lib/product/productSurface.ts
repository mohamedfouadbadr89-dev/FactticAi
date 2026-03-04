import { AIHealthEngine } from './aiHealthEngine';
import { supabaseServer } from '../supabaseServer';

/**
 * Product Surface Orchestrator (Phase 56)
 * Aggregates data from all infrastructure layers to provide a unified product overview.
 */
export class ProductSurface {
  static async getOverview(orgId: string) {
    const health = await AIHealthEngine.computeHealthScore(orgId);
    
    // Aggregate snapshots for the dashboard
    const { data: intercepts } = await supabaseServer.from('runtime_intercepts').select('id, action, risk_score').eq('org_id', orgId);
    const { data: drift } = await supabaseServer.from('model_drift').select('*').eq('org_id', orgId);
    const { data: agents } = await supabaseServer.from('agent_sessions').select('*').eq('org_id', orgId);
    const { data: gateway } = await supabaseServer.from('gateway_requests').select('id, provider').eq('org_id', orgId);

    return {
      health_score: health.health_score,
      risk_level: health.risk_level,
      metrics: health.metrics,
      governance: {
        blocked_responses: intercepts?.filter(i => i.action === 'block').length || 0,
        total_intercepts: intercepts?.length || 0,
        policy_violations: intercepts?.filter(i => i.risk_score > 50).length || 0
      },
      gateway: {
        total_requests: gateway?.length || 0,
        active_providers: Array.from(new Set(gateway?.map(g => g.provider) || [])).length,
      },
      intelligence: {
        drift_alerts: drift?.filter(d => d.drift_score > 50).length || 0,
        model_count: Array.from(new Set(drift?.map(d => d.model_name) || [])).length
      },
      agents: {
        active_agents: agents?.filter(a => a.status === 'running').length || 0,
        total_steps: agents?.reduce((sum, a) => sum + (a.steps || 0), 0) || 0,
        incidents: agents?.filter(a => a.status === 'blocked').length || 0
      }
    };
  }
}
