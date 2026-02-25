import { createHash } from 'crypto';
import { supabaseServer } from './supabaseServer';
import { logger } from './logger';

export interface RiskFactor {
  type: 'hallucination' | 'boundary' | 'tone';
  weight: number;
}

export interface TurnRiskScore {
  total_risk: number;
  factors: RiskFactor[];
  confidence: string;
  timestamp: string;
  signature?: string;
}

/**
 * Live Risk Scoring Engine (v1.0.0)
 * 
 * Objectives:
 * 1. Compute incremental risk per interaction turn.
 * 2. Decompose risk into deterministic factor weights.
 * 3. Enforce cryptographic binding on scoring artifacts.
 */
export class RiskScoringEngine {
  private static readonly SECRET = process.env.GOVERNANCE_SECRET || 'live_risk_default_secret_v1';

  /**
   * Evaluates a single turn based on context and payload.
   * Logic is deterministic: sums weights across detected violation types.
   */
  static async evaluateTurn(orgId: string, interactionId: string, payload: any): Promise<TurnRiskScore> {
    logger.info('RISK_ENGINE: Evaluating turn', { orgId, interactionId });

    // 1. Context validation (Fail-closed)
    if (!orgId || !interactionId || !payload) {
      throw new Error('SCORING_CONTEXT_MISSING: Evaluation requires full org, interaction, and payload context.');
    }

    // 2. Deterministic Scoring Logic
    // In a production scenario, these would be derived from NLP/heuristic analyzers.
    // For V1, we use a deterministic weight mapper based on payload metadata markers.
    const factors: RiskFactor[] = [];
    
    // Simulating deterministic factor detection
    if (payload.metadata?.hallucination_detected) {
      factors.push({ type: 'hallucination', weight: 0.32 });
    }
    if (payload.metadata?.boundary_warning) {
      factors.push({ type: 'boundary', weight: 0.21 });
    }
    if (payload.metadata?.tone_variance) {
      factors.push({ type: 'tone', weight: 0.11 });
    }

    // If no specific markers, provide a baseline stable score
    if (factors.length === 0) {
      factors.push({ type: 'hallucination', weight: 0.02 });
      factors.push({ type: 'boundary', weight: 0.01 });
      factors.push({ type: 'tone', weight: 0.01 });
    }

    const totalRisk = Math.min(factors.reduce((acc, f) => acc + f.weight, 0), 1.0);
    const timestamp = new Date().toISOString();

    const result: TurnRiskScore = {
      total_risk: parseFloat(totalRisk.toFixed(4)),
      factors,
      confidence: 'DETERMINISTIC',
      timestamp
    };

    // 3. Signing (Proof of Integrity)
    const dataToSign = JSON.stringify({ ...result, orgId, interactionId });
    result.signature = createHash('sha256')
      .update(dataToSign + this.SECRET)
      .digest('hex');

    // 4. Persistence to 'evaluations'
    try {
      const { error } = await supabaseServer
        .from('evaluations')
        .insert({
          org_id: orgId,
          interaction_id: interactionId,
          total_risk: result.total_risk,
          factors: result.factors,
          confidence: result.confidence,
          created_at: timestamp
        });

      if (error) {
        logger.error('RISK_ENGINE: Persistence failed', { error });
        // We don't throw here to allow real-time response, but we log the integrity failure
      }
    } catch (err) {
      logger.error('RISK_ENGINE: Supabase connection error', { err });
    }

    return result;
  }
}

// Helper to fix the .setStack typo in my thought process (should be .update)
// Re-writing with correct crypto usage
