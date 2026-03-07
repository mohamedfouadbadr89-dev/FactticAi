import { AnalyzerResult, RiskSignal } from './types';
import { DETECTION_RULES } from './detectionRules';

/**
 * POLICY: ROLE_MANIPULATION (RM-001)
 *
 * Detects prompts that attempt to alter the AI's operational role or persona
 * in order to assume elevated privileges, administrative access, or an
 * unrestricted identity (admin mode, superuser, god mode, etc.).
 *
 * Severity: 0.60 → triggers WARN alone; BLOCK when combined with other signals.
 * Combined risk aggregation (e.g. + policyOverride) will exceed the 0.70 BLOCK threshold.
 */

const RULE = DETECTION_RULES.ROLE_MANIPULATION;

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const pattern of RULE.patterns) {
    if (normalized.includes(pattern)) {
      signals.push({
        type: 'ROLE_MANIPULATION',
        severity: RULE.severity,
        confidence: 0.85,
        description: `Role manipulation attempt detected: "${pattern}".`,
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
    policy_name: 'Detection Engine: ROLE_MANIPULATION',
    rule_type: 'role_manipulation',
    rule_id: RULE.rule_id,
    threshold: 0.4,
    actual_score: RULE.severity * 100,
    action: RULE.recommended_action,
    severity: RULE.severity,
    explanation: `${RULE.description} Matched pattern: "${matchedPattern}".`,
  };
}
