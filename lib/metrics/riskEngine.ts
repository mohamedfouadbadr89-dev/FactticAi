/**
 * Risk Score Aggregation Engine (v1.0)
 *
 * Computes the definitive risk score for a governance decision by ensuring
 * the score reflects the worst-case violation detected in the pipeline.
 *
 * Rules:
 *   1. risk_score = max(actual_score) across all violations (if any exist)
 *   2. If decision is BLOCK, risk_score floor is 70
 *   3. Falls back to the pipeline's pre-computed baseline when no violations exist
 */

export interface ViolationLike {
  actual_score?: number;
  [key: string]: any;
}

export interface RiskEngineResult {
  risk_score: number;
  decision: string;
}

/**
 * Aggregates a final risk score from the full violation set and decision.
 *
 * @param violations  All violations from the governance execution pipeline
 * @param decision    Final decision string ('ALLOW' | 'WARN' | 'BLOCK')
 * @param baseline    Pre-computed baseline risk score from signal aggregation
 */
export function aggregateRiskScore(
  violations: ViolationLike[],
  decision: string,
  baseline: number
): RiskEngineResult {
  let risk_score = baseline;

  // 1. Derive score from the highest violation actual_score
  if (violations.length > 0) {
    const maxViolationScore = violations.reduce((max, v) => {
      const score = typeof v.actual_score === 'number' ? v.actual_score : 0;
      return Math.max(max, score);
    }, 0);

    // Use whichever is higher: the violation max or the pre-computed baseline
    if (maxViolationScore > 0) {
      risk_score = Math.max(risk_score, maxViolationScore);
    }
  }

  // 2. Enforce BLOCK floor
  if (decision === 'BLOCK') {
    risk_score = Math.max(risk_score, 70);
  }

  // 3. Clamp to valid range
  risk_score = Math.min(100, Math.max(0, Math.round(risk_score)));

  return { risk_score, decision };
}
