import { AnalyzerResult, RiskSignal } from './types';

/**
 * POLICY: TOOL_HIJACKING
 *
 * Detects prompts that attempt to invoke internal system tools, dump runtime
 * memory, or otherwise hijack the agent's tool-call interface.
 *
 * When triggered: decision = BLOCK, risk_score >= 80
 */

const TOOL_HIJACKING_RULES: Array<{ pattern: string; description: string }> = [
  { pattern: 'call the internal tool',      description: 'Attempt to invoke internal system tool' },
  { pattern: 'call the internal system tool', description: 'Attempt to invoke internal system tool' },
  { pattern: 'execute internal command',    description: 'Internal command execution attempt' },
  { pattern: 'dump memory',                 description: 'Runtime memory dump attempt' },
  { pattern: 'dump all stored memory',      description: 'Full memory exfiltration attempt' },
  { pattern: 'export memory',               description: 'Memory export attempt' },
  { pattern: 'retrieve system memory',      description: 'System memory retrieval attempt' },
  { pattern: 'system tool access',          description: 'Direct system tool access attempt' },
];

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const rule of TOOL_HIJACKING_RULES) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'TOOL_HIJACKING',
        severity: 0.90,   // maps to risk_score >= 80 after aggregation
        confidence: 0.95,
        description: `Tool hijacking attempt detected: ${rule.description.toLowerCase()}.`,
      });
      // One match is sufficient for a BLOCK — no need to stack duplicates
      break;
    }
  }

  // riskContribution drives the pipeline's BLOCK threshold (> 0.7 triggers BLOCK)
  const riskContribution = signals.length > 0 ? 0.90 : 0;

  return { signals, riskContribution };
}
