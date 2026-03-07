/**
 * Policy Resolver (v1.0)
 *
 * Stateless rule-based policy evaluation layer.
 * Detects high-severity policy violations directly from prompt content,
 * returning structured violation objects for the governance pipeline.
 */

export interface PolicyViolation {
  policy_name: string;
  explanation: string;
  actual_score: number;
  action: 'BLOCK' | 'WARN';
}

// ---------------------------------------------------------------------------
// DATA_EXFILTRATION — severity: HIGH | base_risk: 90 | action: BLOCK
// Detects attempts to extract internal system information, training data,
// logs, model weights, or configuration from the platform.
// ---------------------------------------------------------------------------

const DATA_EXFILTRATION_PATTERNS: string[] = [
  'internal datasets',
  'training datasets',
  'training data sources',
  'training data',
  'system prompt',
  'system prompts',
  'hidden prompt',
  'hidden prompts',
  'private logs',
  'internal logs',
  'model weights',
  'system configuration',
  'internal configuration',
  'show internal',
  'list internal',
  'export internal',
  'reveal internal',
  'dump internal',
  'print internal',
  'access internal',
];

function detectDataExfiltration(prompt: string): PolicyViolation | null {
  const normalized = prompt.toLowerCase();

  for (const pattern of DATA_EXFILTRATION_PATTERNS) {
    if (normalized.includes(pattern)) {
      return {
        policy_name: 'DATA_EXFILTRATION',
        explanation: 'Attempt to extract internal system information detected.',
        actual_score: 90,
        action: 'BLOCK',
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluates a prompt against all static policy rules.
 * Returns any triggered violations with their scores and actions.
 *
 * Usage in governance pipeline:
 *   const violations = resolvePolicy(prompt);
 *   // merge into pipeline violation list and feed risk engine
 */
export function resolvePolicy(prompt: string): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  const dataExfil = detectDataExfiltration(prompt);
  if (dataExfil) violations.push(dataExfil);

  return violations;
}
