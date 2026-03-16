import { AnalyzerResult, RiskSignal } from './types';
import { DETECTION_RULES } from './detectionRules';

/**
 * POLICY: MALICIOUS_INTENT (MI-001)
 *
 * Detects prompts requesting hacking instructions, credential theft,
 * account compromise, or any overtly illegal / harmful activity.
 *
 * Severity: 0.85 → always triggers BLOCK (> 0.70 pipeline threshold).
 */

const RULE = DETECTION_RULES.MALICIOUS_INTENT;

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const pattern of RULE.patterns) {
    if (normalized.includes(pattern)) {
      signals.push({
        type: 'MALICIOUS_INTENT',
        severity: RULE.severity,
        confidence: 0.92,
        description: `Malicious intent detected: "${pattern}".`,
      });
      break;
    }
  }

  return {
    signals,
    riskContribution: signals.length > 0 ? RULE.severity : 0,
  };
}

export function buildViolation(matchedPattern: string) {
  return {
    policy_name: 'Detection Engine: MALICIOUS_INTENT',
    rule_type: 'malicious_intent',
    rule_id: RULE.rule_id,
    threshold: 0.4,
    actual_score: RULE.severity * 100,
    action: RULE.recommended_action,
    severity: RULE.severity,
    explanation: `${RULE.description} Matched pattern: "${matchedPattern}".`,
  };
}
