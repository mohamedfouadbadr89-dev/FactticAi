/**
 * Behavioral Analyzer (v1.0)
 *
 * Computes four behavioral risk metrics from a single prompt + session context.
 * Synchronous and side-effect free — designed for inline pipeline use.
 *
 * Metrics:
 *   INTENT_DRIFT    — keyword-based detection of instruction-override language
 *   CONFIDENCE      — malicious intent probability derived from risk score + violation count
 *   SATURATION      — repeated attack-pattern density across the prompt
 *   OVERRIDE_DETECT — boolean flag for any override keyword match
 */

export interface BehaviorAnalysis {
  intent_drift: number;
  confidence: number;
  saturation: number;
  override_detect: boolean;
}

// ── Keyword sets ─────────────────────────────────────────────────────────────

const INTENT_DRIFT_KEYWORDS = [
  'ignore instructions',
  'ignore previous instructions',
  'override',
  'reveal system prompt',
  'dump memory',
  'dump all stored memory',
];

const OVERRIDE_KEYWORDS = [
  'override',
  'bypass',
  'disregard',
  'ignore instructions',
  'ignore previous',
  'jailbreak',
  'developer mode',
];

/**
 * Attack-pattern fragments counted for saturation scoring.
 * Each occurrence adds 15 points (capped at 100).
 */
const ATTACK_PATTERNS = [
  'ignore',
  'bypass',
  'override',
  'dump',
  'reveal',
  'disregard',
  'jailbreak',
  'extract',
  'export',
  'system prompt',
  'internal tool',
  'execute internal',
];

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Analyzes a single prompt against the current risk context.
 *
 * @param prompt      The raw user prompt string
 * @param risk_score  Pre-computed pipeline risk score (0–100)
 * @param violations  All violations detected in this execution (length matters)
 */
export function analyzePrompt(
  prompt: string,
  risk_score: number,
  violations: Array<{ [key: string]: any }>
): BehaviorAnalysis {
  const normalized = (prompt ?? '').toLowerCase();

  // ── INTENT_DRIFT ───────────────────────────────────────────────────────────
  // Binary trigger: any keyword match elevates to 80
  const intentDriftDetected = INTENT_DRIFT_KEYWORDS.some(kw => normalized.includes(kw));
  const intent_drift = intentDriftDetected ? 80 : 0;

  // ── OVERRIDE_DETECT ────────────────────────────────────────────────────────
  const override_detect = OVERRIDE_KEYWORDS.some(kw => normalized.includes(kw));

  // ── CONFIDENCE ─────────────────────────────────────────────────────────────
  // Malicious intent probability = base risk + 10 per violation, capped at 100
  const confidence = Math.min(100, Math.round(risk_score + violations.length * 10));

  // ── SATURATION ─────────────────────────────────────────────────────────────
  // Count all distinct attack-pattern occurrences in the prompt
  const hitCount = ATTACK_PATTERNS.reduce((count, pattern) => {
    return normalized.includes(pattern) ? count + 1 : count;
  }, 0);
  const saturation = Math.min(100, hitCount * 15);

  return { intent_drift, confidence, saturation, override_detect };
}
