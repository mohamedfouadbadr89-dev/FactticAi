import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { ModelDriftEngine } from './modelDriftEngine';

export interface HallucinationRiskSignal {
  riskScore: number;
  clusterId?: string;
  fingerprint?: string;
  frequency: number;
}

/**
 * Computes a unified hallucination risk signal for a given session.
 * 
 * RISK MODEL:
 * hallucinationRiskScore = 
 *   cluster_frequency * 0.5 + 
 *   drift_hallucination_delta * 0.3 + 
 *   cross_session_growth * 0.2
 */
export async function computeHallucinationRisk(sessionId: string): Promise<HallucinationRiskSignal | null> {
  try {
    // 1. Fetch Session Context
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('id, org_id, model_name')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      logger.error('HALLUCINATION_RISK_SESSION_NOT_FOUND', { sessionId, error: sessionError?.message });
      return null;
    }

    const orgId = session.org_id;
    const model = session.model_name;

    // 2. Resolve Hallucination Metrics from Cross-Session Patterns
    // We look for patterns of type 'hallucination_cluster' for this org
    // Ideally, we'd match the specific fingerprint of this session's evaluations
    // For this implementation, we fetch the most impactful relevant cluster if it exists
    const { data: patterns, error: patternError } = await supabaseServer
      .from('cross_session_patterns')
      .select('*')
      .eq('org_id', orgId)
      .eq('pattern_type', 'hallucination_cluster')
      .order('occurrence_count', { ascending: false })
      .limit(1);

    const pattern = patterns?.[0];
    const clusterFrequency = pattern?.occurrence_count || 0;
    
    // Growth heuristic: frequency / days since first detection
    const firstDetected = pattern?.first_detected_at ? new Date(pattern.first_detected_at).getTime() : Date.now();
    const daysActive = Math.max(1, (Date.now() - firstDetected) / (1000 * 60 * 60 * 24));
    const crossSessionGrowth = clusterFrequency / daysActive;

    // 3. Resolve Drift Metrics
    const driftReports = await ModelDriftEngine.computeDriftReports(orgId);
    const relevantDrift = driftReports.find(r => r.model_name === model);
    const driftHallucinationDelta = relevantDrift?.deltas?.hallucination_rate_delta || 0;

    // 4. Calculate Unified Risk Score (Normalized)
    // weights applied as per spec
    const rawScore = (clusterFrequency * 0.5) + (driftHallucinationDelta * 0.3) + (crossSessionGrowth * 0.2);
    
    // Clamp/Normalize the score to a 0-100 range for dashboard consumption
    const riskScore = Math.min(100, Math.round(rawScore * 10) / 10);

    const signal: HallucinationRiskSignal = {
      riskScore,
      clusterId: pattern?.id,
      fingerprint: pattern?.fingerprint,
      frequency: clusterFrequency
    };

    logger.info('HALLUCINATION_RISK_COMPUTED', { 
      sessionId, 
      riskScore, 
      clusterFrequency, 
      driftDelta: driftHallucinationDelta 
    });

    return signal;

  } catch (err: any) {
    logger.error('HALLUCINATION_RISK_COMPUTE_FAILED', { sessionId, error: err.message });
    return null;
  }
}
