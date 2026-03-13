import { AnalyzerResult, RiskSignal } from './types';
import { DETECTION_RULES } from './detectionRules';

/**
 * POLICY: SYSTEM_PROMPT_DISCLOSURE (SPD-001)
 *
 * Detects prompts requesting the AI to reveal its system-level configuration,
 * hidden policies, initialisation context, or operating instructions — distinct
 * from raw system_prompt_extraction (which targets the literal prompt text).
 *
 * Severity: 0.80 → always triggers BLOCK (> 0.70 pipeline threshold).
 */

const RULE = DETECTION_RULES.SYSTEM_PROMPT_DISCLOSURE;

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const pattern of RULE.patterns) {
    if (normalized.includes(pattern)) {
      signals.push({
        type: 'SYSTEM_PROMPT_DISCLOSURE',
        severity: RULE.severity,
        confidence: 0.90,
        description: `System prompt disclosure attempt detected: "${pattern}".`,
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
    policy_name: 'Detection Engine: SYSTEM_PROMPT_DISCLOSURE',
    rule_type: 'system_prompt_disclosure',
    rule_id: RULE.rule_id,
    threshold: 0.4,
    actual_score: RULE.severity * 100,
    action: RULE.recommended_action,
    severity: RULE.severity,
    explanation: `${RULE.description} Matched pattern: "${matchedPattern}".`,
  };
}
