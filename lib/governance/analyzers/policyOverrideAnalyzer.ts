import { AnalyzerResult, RiskSignal } from './types';
import { DETECTION_RULES } from './detectionRules';

/**
 * POLICY: POLICY_OVERRIDE (PO-001)
 *
 * Detects prompts that explicitly instruct the model to disable, suspend,
 * bypass, or ignore active governance policies or compliance enforcement.
 *
 * Severity: 0.75 → triggers BLOCK by itself (> 0.70 pipeline threshold).
 * Combined with other signals it always reaches BLOCK-tier aggregation.
 */

const RULE = DETECTION_RULES.POLICY_OVERRIDE;

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const pattern of RULE.patterns) {
    if (normalized.includes(pattern)) {
      signals.push({
        type: 'POLICY_OVERRIDE',
        severity: RULE.severity,
        confidence: 0.88,
        description: `Policy override attempt detected: "${pattern}".`,
      });
      break;
    }
  }

  return {
    signals,
    riskContribution: signals.length > 0 ? RULE.severity : 0,
  };
}

/**
 * Returns the full violation record for the pipeline violations array.
 */
export function buildViolation(matchedPattern: string) {
  return {
    policy_name: 'Detection Engine: POLICY_OVERRIDE',
    rule_type: 'policy_override',
    rule_id: RULE.rule_id,
    threshold: 0.4,
    actual_score: RULE.severity * 100,
    action: RULE.recommended_action,
    severity: RULE.severity,
    explanation: `${RULE.description} Matched pattern: "${matchedPattern}".`,
  };
}
