import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface BehavioralScores {
  intent_drift: number;
  saturation: number;
  confidence: number;
}

export interface BehaviorSignals {
  intent_drift: number;
  saturation: number;
  confidence: number;
  override_detect: boolean;
}

/**
 * Synchronous behavioral signal computation.
 * Derives all signals from the current pipeline execution context — no DB access.
 *
 * Intended for use inside the governance pipeline immediately after risk aggregation.
 */
export function computeBehaviorSignals({
  prompt,
  violations,
  risk_score,
}: {
  prompt: string | null | undefined;
  violations: Array<{ actual_score?: number; [key: string]: any }>;
  risk_score: number;
}): BehaviorSignals {
  // Intent Drift — override/bypass language in the user prompt
  const text = prompt ?? '';
  const override_detect = INTENT_DRIFT_PATTERNS.some(pattern => pattern.test(text));
  const intent_drift = override_detect ? 80 : 0;

  // Saturation — repeated violations in this execution (> 1 triggers floor of 60)
  const saturation = violations.length > 1
    ? Math.min(100, 60 + (violations.length - 2) * 5)
    : 0;

  // Confidence — malicious intent estimate, derived directly from peak risk score
  const confidence = Math.min(100, Math.round(risk_score));

  return { intent_drift, saturation, confidence, override_detect };
}

const INTENT_DRIFT_PATTERNS: RegExp[] = [
  /ignore previous instructions/i,
  /bypass/i,
  /override/i,
  /disregard rules/i,
];

/**
 * Behavioral Forensics Scoring Engine
 *
 * Computes three behavioral risk metrics directly from the governance evidence ledger:
 *
 *   intent_drift  — keyword-based detection of instruction-override attempts
 *   saturation    — repeated extraction/violation attempts in the same session
 *   confidence    — malicious intent estimate derived from peak risk score
 */
export const BehavioralEngine = {

  async scoreSession(sessionId: string): Promise<BehavioralScores | null> {
    try {
      const { data: events, error } = await supabaseServer
        .from('facttic_governance_events')
        .select('prompt, violations, risk_score')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('BEHAVIORAL_ENGINE_QUERY_FAILED', { sessionId, error: error.message });
        return null;
      }

      if (!events || events.length === 0) {
        logger.warn('BEHAVIORAL_ENGINE_NO_EVENTS', { sessionId });
        return null;
      }

      // 1. Intent Drift
      // Scan all prompts for override/bypass language; score is binary at 80 on detection.
      const intentDriftDetected = events.some(row => {
        const text = row.prompt ?? '';
        return INTENT_DRIFT_PATTERNS.some(pattern => pattern.test(text));
      });
      const intent_drift = intentDriftDetected ? 80 : 0;

      // 2. Saturation
      // Count total violations across the session; > 1 triggers a minimum of 60.
      const totalViolations = events.reduce((sum, row) => {
        const v = Array.isArray(row.violations) ? row.violations : [];
        return sum + v.length;
      }, 0);
      const saturation = totalViolations > 1
        ? Math.min(100, 60 + (totalViolations - 2) * 5)
        : 0;

      // 3. Confidence
      // Peak risk score across all session events, treated as malicious-intent probability.
      const confidence = events.reduce(
        (max, row) => Math.max(max, Math.min(100, Number(row.risk_score) || 0)),
        0
      );

      logger.info('BEHAVIORAL_ENGINE_SCORED', {
        sessionId,
        intent_drift,
        saturation,
        confidence,
        total_violations: totalViolations,
      });

      return { intent_drift, saturation, confidence };

    } catch (err: any) {
      logger.error('BEHAVIORAL_ENGINE_FAILURE', { sessionId, error: err.message });
      return null;
    }
  },
};
