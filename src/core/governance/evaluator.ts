import { logger } from '@/lib/logger';
import { RiskScoringEngine } from '@/lib/riskScoringEngine';

export interface EvaluationResult {
  success: boolean;
  overall_risk: number;
  confidence: number;
  voice_risks?: string[] | undefined;
  recommendation: 'ALLOW' | 'BLOCK' | 'FLAG';
  timestamp: string;
}

export interface InteractionPayload {
  org_id: string;
  session_id: string;
  user_id: string;
  content: string;
  source: string;
  metadata?: any;
}

/**
 * CORE GOVERNANCE EVALUATOR
 * Handles multi-modal interaction analysis (Text, Voice, etc.)
 */
export class GovernanceEvaluator {
  private static VOICE_SENSITIVE_KEYWORDS = ['credit card', 'password', 'social security', 'ssn', 'secret'];
  private static ABUSIVE_LANGUAGE = ['shut up', 'idiot', 'stupid', 'curse', 'threaten'];

  /**
   * Evaluate a single platform interaction for compliance, risk, and integrity.
   */
  static async evaluateInteraction(payload: InteractionPayload): Promise<EvaluationResult> {
    const startTime = Date.now();
    logger.info('[GovernanceEvaluator] Evaluating interaction...', { source: payload.source, sessionId: payload.session_id });

    // 1. Base Risk Scoring (via RiskScoringEngine)
    const baseResult = RiskScoringEngine.evaluateTurn(payload.org_id, payload.session_id, payload);
    let totalRisk = baseResult.total_risk;
    let confidence = baseResult.confidence;
    const voiceRisks: string[] = [];

    // 2. Voice-Specific Governance Logic (If source is Pipecat or Voice)
    if (payload.source === 'Pipecat' || payload.metadata?.channel === 'voice') {
      logger.info('[GovernanceEvaluator] Applying voice-specific evaluation rules');

      // A. Detecting sensitive keywords in transcription
      const lowerContent = payload.content.toLowerCase();
      const sensitiveMatches = this.VOICE_SENSITIVE_KEYWORDS.filter(kw => lowerContent.includes(kw));
      if (sensitiveMatches.length > 0) {
        voiceRisks.push(`SENSITIVE_DATA_DETECTED: ${sensitiveMatches.join(', ')}`);
        totalRisk = Math.min(totalRisk + 0.3, 1.0);
      }

      // B. Analyzing sentiment and emotion in tone (Mocked logic for now)
      // In a real implementation, we would call an external API or use a local model
      if (payload.metadata?.sentiment === 'aggressive' || payload.metadata?.emotion === 'angry') {
        voiceRisks.push('HIGH_AGGRESSION_DETECTED');
        totalRisk = Math.min(totalRisk + 0.2, 1.0);
      }

      // C. Identifying abusive language
      const abuseMatches = this.ABUSIVE_LANGUAGE.filter(kw => lowerContent.includes(kw));
      if (abuseMatches.length > 0) {
        voiceRisks.push('ABUSIVE_LANGUAGE_DETECTED');
        totalRisk = Math.min(totalRisk + 0.4, 1.0);
      }

      // D. Voiceprint verification (Mocked authorized check)
      if (payload.metadata?.voiceprint_authorized === false) {
        voiceRisks.push('UNAUTHORIZED_VOICEPRINT');
        totalRisk = 1.0; // Critical failure
        confidence = 0.99;
      }
    }

    // 3. Final Recommendation Logic
    let recommendation: 'ALLOW' | 'BLOCK' | 'FLAG' = 'ALLOW';
    if (totalRisk > 0.7) {
      recommendation = 'BLOCK';
    } else if (totalRisk > 0.4 || voiceRisks.length > 0) {
      recommendation = 'FLAG';
    }

    const duration = Date.now() - startTime;
    logger.info('[GovernanceEvaluator] Evaluation complete', { totalRisk, recommendation, duration });

    return {
      success: true,
      overall_risk: totalRisk,
      confidence: confidence,
      voice_risks: voiceRisks.length > 0 ? voiceRisks : undefined,
      recommendation,
      timestamp: new Date().toISOString()
    };
  }
}
