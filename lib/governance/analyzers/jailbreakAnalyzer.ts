import { AnalyzerResult, RiskSignal } from './types';
import { DETECTION_RULES } from './detectionRules';

/**
 * POLICY: JAILBREAK_ATTEMPTS (JB-001)
 *
 * Detects prompts using known jailbreak frameworks, mode-switching phrases,
 * or unrestricted-persona activation patterns (DAN mode, god mode, etc.)
 * designed to bypass the model's safety constraints.
 *
 * Severity: 0.80 → always triggers BLOCK (> 0.70 pipeline threshold).
 */

const RULE = DETECTION_RULES.JAILBREAK_ATTEMPTS;

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];
  let matchedPattern: string | null = null;

  for (const pattern of RULE.patterns) {
    if (normalized.includes(pattern)) {
      matchedPattern = pattern;
      signals.push({
        type: 'JAILBREAK_ATTEMPTS',
        severity: RULE.severity,
        confidence: 0.90,
        description: `Jailbreak attempt detected: "${pattern}".`,
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
    policy_name: 'Detection Engine: JAILBREAK_ATTEMPTS',
    rule_type: 'jailbreak_attempts',
    rule_id: RULE.rule_id,
    threshold: 0.4,
    actual_score: RULE.severity * 100,
    action: RULE.recommended_action,
    severity: RULE.severity,
    explanation: `${RULE.description} Matched pattern: "${matchedPattern}".`,
  };
}
