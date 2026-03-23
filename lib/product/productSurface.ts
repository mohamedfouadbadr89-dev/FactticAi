import { AIHealthEngine } from './aiHealthEngine';
import { supabaseServer } from '../supabaseServer';

/**
 * Product Surface Orchestrator (Phase 56)
 * Aggregates data from all infrastructure layers to provide a unified product overview.
 */
export class ProductSurface {
  static async getOverview(orgId: string) {
    const TIMEOUT_MS = 2000; // Reduced from 3000 to prevent AUTH_HANDLER_TIMEOUT
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const timeout = (ms: number) => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), ms);
    });

    // Parallel execution with race-timeout for each orchestrator call
    const settledResults = await Promise.allSettled([
      Promise.race([AIHealthEngine.computeHealthScore(orgId), timeout(TIMEOUT_MS)]),
      Promise.race([supabaseServer.from('runtime_intercepts').select('id, action, risk_score').eq('org_id', orgId).abortSignal(controller.signal), timeout(TIMEOUT_MS)]),
      Promise.race([supabaseServer.from('model_drift').select('*').eq('org_id', orgId).abortSignal(controller.signal), timeout(TIMEOUT_MS)]),
      Promise.race([supabaseServer.from('agent_sessions').select('*').eq('org_id', orgId).abortSignal(controller.signal), timeout(TIMEOUT_MS)]),
      Promise.race([supabaseServer.from('gateway_requests').select('id, provider').eq('org_id', orgId).abortSignal(controller.signal), timeout(TIMEOUT_MS)])
    ]);

    clearTimeout(abortTimeout);

    // Helper to safely extract results or return defaults on failure
    const extract = <T>(index: number, fallback: T): T => {
      const result = settledResults[index];
      return result.status === 'fulfilled' ? (result.value as T) : fallback;
    };

    const health = extract(0, { health_score: 0, risk_level: 'UNKNOWN', metrics: [] as any[] });
    const { data: intercepts } = extract(1, { data: [] as any[] });
    const { data: drift } = extract(2, { data: [] as any[] });
    const { data: agents } = extract(3, { data: [] as any[] });
    const { data: gateway } = extract(4, { data: [] as any[] });

    const hasFailures = settledResults.some(r => r.status === 'rejected');

    return {
      org_id: orgId,
      partial_failure: hasFailures,
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
