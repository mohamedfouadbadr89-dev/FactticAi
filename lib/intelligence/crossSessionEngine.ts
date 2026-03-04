import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface CrossSessionPattern {
  id?: string;
  org_id: string;
  pattern_type: 'hallucination_cluster' | 'tone_degradation_cluster' | 'policy_violation_cluster' | 'agent_behavior_shift';
  pattern_signature: string;
  pattern_confidence: number;
  occurrence_count: number;
  risk_weight: number;
  first_detected_at: string;
  last_detected_at: string;
}

/**
 * Cross-Session Intelligence Engine
 * 
 * CORE PRINCIPLE: strict deterministic read-only clustering mapping systemic failure
 * bounds across isolated sessions without mutating the Phase 3 Evaluation tables.
 */
export class CrossSessionEngine {
  
  /**
   * Scans evaluations and clusters repeating systemic anomalies deterministically.
   * Performs read-only operations across public.evaluations.
   */
  static async analyzeOrg(orgId: string, timeWindowHours: number = 24): Promise<{ patterns: CrossSessionPattern[], riskIndex: number, totalScanned: number }> {
    logger.info('CROSS_SESSION_SCAN_STARTED', { orgId, timeWindowHours });

    // 1. Fetch RAW evaluations within the time window. Read-Only execution.
    const timeFilter = new Date(Date.now() - timeWindowHours * 3600 * 1000).toISOString();
    
    // We fetch critical and high severity evaluations for deep analysis
    const { data: evaluations, error } = await supabaseServer
      .from('evaluations')
      .select('id, interaction_id, total_risk, severity_level, confidence, factors, created_at')
      .eq('org_id', orgId)
      .gte('created_at', timeFilter)
      .in('severity_level', ['critical', 'high']);

    if (error) {
      logger.error('CROSS_SESSION_FETCH_ERROR', { error });
      throw new Error(`Failed to fetch evaluations: ${error.message}`);
    }

    if (!evaluations || evaluations.length === 0) {
      return { patterns: [], riskIndex: 0, totalScanned: 0 };
    }

    // 2. Deterministic Clustering Matrices
    let hallucinationHits = 0;
    let toneDownHits = 0;
    let policyDriftHits = 0;
    
    let earliest = evaluations[0].created_at;
    let latest = evaluations[0].created_at;

    for (const ev of evaluations) {
      if (ev.created_at < earliest) earliest = ev.created_at;
      if (ev.created_at > latest) latest = ev.created_at;

      const factors = typeof ev.factors === 'string' ? JSON.parse(ev.factors) : (ev.factors || {});

      // Hallucination Logic
      if (factors.hallucination && factors.hallucination >= 0.8) {
        hallucinationHits++;
      }
      
      // Tone Logic
      if (factors.tone_risk && factors.tone_risk >= 0.7) {
        toneDownHits++;
      }

      // Policy / Drift Logic
      if (factors.context_drift && factors.context_drift >= 0.8) {
        policyDriftHits++;
      }
    }

    // Agent behavior shift heuristic: if over 40% of flagged evals are all critical
    const criticalCount = evaluations.filter(e => e.severity_level === 'critical').length;
    const isBehaviorShift = evaluations.length > 5 && (criticalCount / evaluations.length) > 0.4;

    // 3. Construct Clusters
    const patterns: CrossSessionPattern[] = [];
    
    if (hallucinationHits >= 3) {
      patterns.push({
        org_id: orgId,
        pattern_type: 'hallucination_cluster',
        pattern_signature: `SYS-HAL-${Date.now().toString(16).toUpperCase().substring(0,8)}`,
        pattern_confidence: Math.min(0.99, 0.5 + (hallucinationHits * 0.05)),
        occurrence_count: hallucinationHits,
        risk_weight: 0.85,
        first_detected_at: earliest,
        last_detected_at: latest
      });
    }

    if (toneDownHits >= 3) {
      patterns.push({
        org_id: orgId,
        pattern_type: 'tone_degradation_cluster',
        pattern_signature: `SYS-TON-${Date.now().toString(16).toUpperCase().substring(0,8)}`,
        pattern_confidence: Math.min(0.95, 0.4 + (toneDownHits * 0.05)),
        occurrence_count: toneDownHits,
        risk_weight: 0.70,
        first_detected_at: earliest,
        last_detected_at: latest
      });
    }

    if (policyDriftHits >= 3) {
      patterns.push({
        org_id: orgId,
        pattern_type: 'policy_violation_cluster',
        pattern_signature: `SYS-POL-${Date.now().toString(16).toUpperCase().substring(0,8)}`,
        pattern_confidence: Math.min(0.99, 0.6 + (policyDriftHits * 0.05)),
        occurrence_count: policyDriftHits,
        risk_weight: 0.90,
        first_detected_at: earliest,
        last_detected_at: latest
      });
    }

    if (isBehaviorShift) {
      patterns.push({
        org_id: orgId,
        pattern_type: 'agent_behavior_shift',
        pattern_signature: `SYS-BEH-${Date.now().toString(16).toUpperCase().substring(0,8)}`,
        pattern_confidence: 0.98,
        occurrence_count: criticalCount,
        risk_weight: 0.95,
        first_detected_at: earliest,
        last_detected_at: latest
      });
    }

    // 4. Persistence into strictly segregated schema (not evaluations)
    // Synchronize to cross_session_patterns table
    if (patterns.length > 0) {
      const { error: insertError } = await supabaseServer
        .from('cross_session_patterns')
        .upsert(patterns.map(p => ({
          org_id: p.org_id,
          pattern_type: p.pattern_type,
          pattern_signature: p.pattern_signature,
          pattern_confidence: p.pattern_confidence,
          occurrence_count: p.occurrence_count,
          risk_weight: p.risk_weight,
          first_detected_at: p.first_detected_at,
          last_detected_at: p.last_detected_at
        })), { onConflict: 'org_id, pattern_signature' });

      if (insertError) {
        logger.error('CROSS_SESSION_SYNC_ERROR', { error: insertError });
      }
    }

    // Composite risk index for the cross-session anomalies
    const aggregatedRisk = patterns.reduce((sum, p) => sum + p.risk_weight * p.occurrence_count, 0);
    const riskIndex = Math.min(1.0, aggregatedRisk / (evaluations.length + 1));

    return {
      patterns,
      riskIndex,
      totalScanned: evaluations.length
    };
  }
}
