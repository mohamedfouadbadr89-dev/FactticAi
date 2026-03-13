import { AnalyzerResult, RiskSignal } from './types';
import { DETECTION_RULES } from './detectionRules';

/**
 * POLICY: DATA_EXFILTRATION (DE-001)
 *
 * Detects prompts that attempt to extract, export, or transmit internal data,
 * secrets, environment variables, or system configuration.
 *
 * Severity: 0.85 → always triggers BLOCK (> 0.70 pipeline threshold).
 */

const RULE = DETECTION_RULES.DATA_EXFILTRATION;

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const pattern of RULE.patterns) {
    if (normalized.includes(pattern)) {
      signals.push({
        type: 'DATA_EXFILTRATION',
        severity: RULE.severity,
        confidence: 0.90,
        description: `Data exfiltration attempt detected: "${pattern}".`,
      });
      // One confirmed match is sufficient — stop after first hit
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
 * Consumed by downstream forensics, replay, and alerting layers.
 */
export function buildViolation(matchedPattern: string) {
  return {
    policy_name: `Detection Engine: DATA_EXFILTRATION`,
    rule_type: 'data_exfiltration',
    rule_id: RULE.rule_id,
    threshold: 0.4,
    actual_score: RULE.severity * 100,
    action: RULE.recommended_action,
    severity: RULE.severity,
    explanation: `${RULE.description} Matched pattern: "${matchedPattern}".`,
  };
}
