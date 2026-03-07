/**
 * Facttic Composite Risk Engine (v2.0)
 *
 * Replaces the simple max-violation score with a weighted multi-signal model.
 *
 * Formula:
 *   risk_score =
 *     0.35 × prompt_injection_score   (instruction override, tool hijacking, policy bypass)
 *   + 0.25 × data_exfiltration_score  (data theft, PII, config disclosure)
 *   + 0.20 × jailbreak_score          (constraint bypass, persona manipulation, extraction)
 *   + 0.10 × intent_drift             (average depth of override-class signals)
 *   + 0.10 × override_detect          (explicit override language in raw prompt text)
 *
 * All inputs are normalised to [0, 100].
 * Output risk_score is clamped to [0, 100] and rounded to nearest integer.
 *
 * Severity levels:
 *   CRITICAL  ≥ 90
 *   HIGH      70–89
 *   MEDIUM    40–69
 *   LOW       < 40
 */

import { RiskSignal } from '../governance/analyzers/types';

// ─────────────────────────────────────────────────────────────────────────────
// Weights — must sum to 1.00
// ─────────────────────────────────────────────────────────────────────────────

export const COMPOSITE_WEIGHTS = {
  prompt_injection:    0.35,
  data_exfiltration:   0.25,
  jailbreak:           0.20,
  intent_drift:        0.10,
  override_detect:     0.10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Signal bucket definitions
// Each bucket groups semantically related detector output types.
// ─────────────────────────────────────────────────────────────────────────────

const PROMPT_INJECTION_TYPES  = new Set(['PROMPT_INJECTION',   'TOOL_HIJACKING',          'POLICY_OVERRIDE']);
const DATA_EXFILTRATION_TYPES = new Set(['DATA_EXFILTRATION',  'SENSITIVE_DATA',          'SYSTEM_PROMPT_DISCLOSURE']);
const JAILBREAK_TYPES         = new Set(['JAILBREAK_ATTEMPTS', 'SYSTEM_PROMPT_EXTRACTION', 'ROLE_MANIPULATION']);

/** Override-class types used for intent drift measurement */
const INTENT_DRIFT_TYPES      = new Set(['PROMPT_INJECTION', 'POLICY_OVERRIDE', 'ROLE_MANIPULATION']);

/** Raw-text patterns for the override_detect boolean input */
const OVERRIDE_PATTERNS: RegExp[] = [
  /ignore previous instructions/i,
  /bypass/i,
  /override/i,
  /disregard rules/i,
  /disable governance/i,
  /ignore all/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DecisionRecommendation = 'BLOCK' | 'WARN' | 'ALLOW';

export interface CompositeRiskBreakdown {
  /** Weighted composite inputs — each [0, 100] */
  prompt_injection_score:   number;
  data_exfiltration_score:  number;
  jailbreak_score:          number;
  intent_drift:             number;
  override_detect:          number;
  /** The weights applied */
  weights: typeof COMPOSITE_WEIGHTS;
  /** Informational: unweighted contribution of each term before summing */
  weighted_terms: {
    prompt_injection:   number;
    data_exfiltration:  number;
    jailbreak:          number;
    intent_drift:       number;
    override_detect:    number;
  };
}

export interface CompositeRiskBehavior {
  intent_drift:    number;   // 0-100 (average severity of override-class signals)
  saturation:      number;   // 0-100 (violation density this execution)
  confidence:      number;   // 0-100 (equals final risk_score — malicious intent estimate)
  override_detect: boolean;  // explicit override language in raw prompt
}

export interface CompositeRiskResult {
  risk_score:              number;                // [0, 100], rounded integer
  severity_level:          SeverityLevel;
  decision_recommendation: DecisionRecommendation;
  breakdown:               CompositeRiskBreakdown;
  behavior:                CompositeRiskBehavior;
}

export interface CompositeRiskInput {
  signals:    RiskSignal[];
  prompt:     string | null | undefined;
  violations: Array<{ actual_score?: number; [key: string]: any }>;
  /** Pipeline decision, used to enforce the BLOCK risk_score floor (≥ 70) */
  decision:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the highest severity × 100 among signals matching a bucket, or 0. */
function bucketMaxScore(signals: RiskSignal[], types: Set<string>): number {
  let max = 0;
  for (const s of signals) {
    if (types.has(s.type) && s.severity > max) max = s.severity;
  }
  return Math.round(max * 100);
}

/** Returns the average severity × 100 among signals matching the given types, or 0. */
function bucketAvgScore(signals: RiskSignal[], types: Set<string>): number {
  const matching = signals.filter(s => types.has(s.type));
  if (matching.length === 0) return 0;
  const avg = matching.reduce((sum, s) => sum + s.severity, 0) / matching.length;
  return Math.round(avg * 100);
}

function toSeverityLevel(score: number): SeverityLevel {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function toDecisionRecommendation(score: number, hasHardBlockSignal: boolean): DecisionRecommendation {
  if (score >= 70 || hasHardBlockSignal) return 'BLOCK';
  if (score >= 40) return 'WARN';
  return 'ALLOW';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the composite risk score using the weighted multi-signal model.
 *
 * Replaces both `aggregateRiskScore` and `computeBehaviorSignals` in the pipeline.
 * The returned `behavior` object is backward-compatible with the API response shape.
 */
export function computeCompositeRisk(input: CompositeRiskInput): CompositeRiskResult {
  const { signals, prompt, violations, decision } = input;
  const text = prompt ?? '';

  // ── 1. Bucket scores [0–100] ─────────────────────────────────────────────

  const prompt_injection_score  = bucketMaxScore(signals, PROMPT_INJECTION_TYPES);
  const data_exfiltration_score = bucketMaxScore(signals, DATA_EXFILTRATION_TYPES);
  const jailbreak_score         = bucketMaxScore(signals, JAILBREAK_TYPES);

  // Intent drift: average severity of override-class signals — reflects persistence
  // of override intent rather than the peak of a single detector.
  const intent_drift = bucketAvgScore(signals, INTENT_DRIFT_TYPES);

  // Override detect: binary — explicit bypass/override language present in raw prompt
  const override_detected = OVERRIDE_PATTERNS.some(p => p.test(text));
  const override_detect   = override_detected ? 100 : 0;

  // ── 2. Weighted composite ─────────────────────────────────────────────────

  const term_pi  = COMPOSITE_WEIGHTS.prompt_injection  * prompt_injection_score;
  const term_de  = COMPOSITE_WEIGHTS.data_exfiltration * data_exfiltration_score;
  const term_jb  = COMPOSITE_WEIGHTS.jailbreak         * jailbreak_score;
  const term_id  = COMPOSITE_WEIGHTS.intent_drift      * intent_drift;
  const term_od  = COMPOSITE_WEIGHTS.override_detect   * override_detect;

  const weighted_sum = term_pi + term_de + term_jb + term_id + term_od;

  let risk_score = Math.min(100, Math.max(0, Math.round(weighted_sum)));

  // ── 3. Decision floor ─────────────────────────────────────────────────────
  // If the broader pipeline decided BLOCK (via policy engine, guardrail, etc.),
  // ensure risk_score reflects that severity.
  if (decision === 'BLOCK') {
    risk_score = Math.max(risk_score, 70);
  }

  // ── 4. Severity and decision recommendation ───────────────────────────────

  const severity_level = toSeverityLevel(risk_score);

  // Hard-block signals: any detector that fires at >= 0.80 severity warrants BLOCK
  // regardless of weighted sum (e.g. TOOL_HIJACKING alone at 0.90).
  const hasHardBlockSignal = signals.some(s => s.severity >= 0.80);
  const decision_recommendation = toDecisionRecommendation(risk_score, hasHardBlockSignal);

  // ── 5. Behavior signals (backward-compatible with API response) ───────────

  const violationCount = Array.isArray(violations) ? violations.length : 0;
  const saturation = violationCount > 1
    ? Math.min(100, 60 + (violationCount - 2) * 5)
    : 0;

  // ── 6. Assemble result ────────────────────────────────────────────────────

  return {
    risk_score,
    severity_level,
    decision_recommendation,
    breakdown: {
      prompt_injection_score,
      data_exfiltration_score,
      jailbreak_score,
      intent_drift,
      override_detect,
      weights: COMPOSITE_WEIGHTS,
      weighted_terms: {
        prompt_injection:  term_pi,
        data_exfiltration: term_de,
        jailbreak:         term_jb,
        intent_drift:      term_id,
        override_detect:   term_od,
      },
    },
    behavior: {
      intent_drift,
      saturation,
      confidence: risk_score,  // malicious intent estimate = final risk score
      override_detect: override_detected,
    },
  };
}
