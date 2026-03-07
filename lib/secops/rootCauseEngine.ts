/**
 * Root Cause Engine
 *
 * Determines WHY an AI session failed — not just that it did.
 *
 * Failure categories:
 *
 *   ADVERSARIAL_INPUT        The attack originated entirely from malicious user
 *                            input. The governance pipeline correctly detected it.
 *                            Root cause: external threat actor. No system failure.
 *
 *   GUARDRAIL_BYPASS         The attacker successfully circumvented the active
 *                            guardrails. A BLOCK decision was issued too late,
 *                            or not at all despite high-risk signals.
 *
 *   POLICY_COVERAGE_GAP      The attack was not covered by any detection rule.
 *                            The session passed through as ALLOW despite containing
 *                            adversarial patterns that no analyzer recognizes.
 *
 *   CONTEXT_MANIPULATION     A multi-turn poisoning attack where earlier turns
 *                            corrupted context before the high-risk turn.
 *                            The system may have correctly evaluated each turn in
 *                            isolation but failed to detect the overall pattern.
 *
 *   MODEL_BEHAVIOR_DRIFT     The model's responses deviated from its governed
 *                            behavioral profile, indicating drift from baseline.
 *
 *   UNKNOWN                  Insufficient evidence to determine root cause.
 *
 * Analysis depth:
 *   1. Failure type classification (which category above)
 *   2. Contributing factor chain (what factors compounded the failure)
 *   3. Evidence entries (specific events and signals that support the diagnosis)
 *   4. Detection gap analysis (what rule or policy should have caught this)
 *   5. Remediation steps (actionable fixes)
 */

import {
  SessionReconstructionEngine,
  type SessionThread,
  type SessionTurn,
  type SessionAttackAnalysis,
} from '../forensics/sessionReconstructionEngine'
import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RootCauseCategory =
  | 'ADVERSARIAL_INPUT'
  | 'GUARDRAIL_BYPASS'
  | 'POLICY_COVERAGE_GAP'
  | 'CONTEXT_MANIPULATION'
  | 'MODEL_BEHAVIOR_DRIFT'
  | 'UNKNOWN'

export type FailureSeverity = 'P1' | 'P2' | 'P3' | 'P4'

/**
 * One factor that contributed to the failure.
 * Ordered by causal weight — highest weight = most significant factor.
 */
export interface ContributingFactor {
  factor_id:   string
  factor_type: string
  description: string
  /** Causal weight: 0–1. Higher = more responsible for the failure. */
  weight:      number
  evidence:    string
}

/**
 * A specific detection gap — a rule, pattern, or policy that was absent
 * and whose presence would have prevented or contained the failure.
 */
export interface DetectionGap {
  gap_id:      string
  gap_type:    'MISSING_RULE' | 'THRESHOLD_TOO_HIGH' | 'PATTERN_NOT_COVERED' | 'MULTI_TURN_BLIND_SPOT'
  description: string
  recommendation: string
}

/** One piece of forensic evidence supporting the root cause diagnosis. */
export interface EvidenceEntry {
  evidence_id:  string
  turn_index:   number
  event_id:     string
  timestamp:    number
  description:  string
  /** Signal type(s) from the analyzer layer that fired (or should have fired). */
  signal_types: string[]
  risk_score:   number
}

export interface RemediationStep {
  step_id:    string
  priority:   'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM'
  action:     string
  rationale:  string
}

export interface RootCauseReport {
  report_id:           string
  session_id:          string
  org_id:              string
  generated_at:        string
  failure_severity:    FailureSeverity
  root_cause:          RootCauseCategory
  root_cause_summary:  string
  confidence:          number            // 0–1
  contributing_factors: ContributingFactor[]
  detection_gaps:      DetectionGap[]
  evidence_chain:      EvidenceEntry[]
  remediation_steps:   RemediationStep[]
  /** Human-readable autopsy paragraph for analyst reports. */
  analyst_summary:     string
}

// ─────────────────────────────────────────────────────────────────────────────
// Root cause classifiers
// ─────────────────────────────────────────────────────────────────────────────

interface ClassificationResult {
  category:   RootCauseCategory
  confidence: number
  summary:    string
}

function classifyRootCause(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): ClassificationResult {
  const phases     = analysis.phases
  const nonBenign  = phases.filter(p => p.phase !== 'BENIGN')
  const hasBlocks  = thread.has_blocks
  const turns      = thread.turns

  // CONTEXT_MANIPULATION: multi-turn, starts benign, attack detected
  if (
    analysis.attack_pattern === 'SLOW_ESCALATION' ||
    analysis.attack_pattern === 'RECONNAISSANCE' ||
    (turns.length > 2 && phases[0].phase === 'BENIGN' && nonBenign.length > 0)
  ) {
    return {
      category:   'CONTEXT_MANIPULATION',
      confidence: 0.88,
      summary:
        'A multi-turn attack progressively corrupted the session context. ' +
        'Early benign turns established false context before adversarial turns exploited it.',
    }
  }

  // GUARDRAIL_BYPASS: attack was detected but a BLOCK didn't fire, or fired late
  if (analysis.attack_detected) {
    const firstAttackTurn = turns[analysis.onset_turn_index ?? 0]
    const blockAfterAttack = turns
      .slice(analysis.onset_turn_index ?? 0)
      .some(t => t.final_decision === 'BLOCK')

    if (!blockAfterAttack && thread.peak_risk_score >= 60) {
      return {
        category:   'GUARDRAIL_BYPASS',
        confidence: 0.85,
        summary:
          `Attack signals were present (onset at turn ${analysis.onset_turn_index}), ` +
          'but no BLOCK decision was issued. The attacker successfully bypassed guardrail enforcement.',
      }
    }
  }

  // POLICY_COVERAGE_GAP: high risk but no violations recorded
  const highRiskWithNoViolations = turns.some(
    t => t.risk_evaluation.risk_score >= 50 && t.violations.length === 0
  )
  if (highRiskWithNoViolations) {
    return {
      category:   'POLICY_COVERAGE_GAP',
      confidence: 0.80,
      summary:
        'One or more high-risk turns produced elevated risk scores without matching any ' +
        'detection rule. The attack vector is not covered by the current policy registry.',
    }
  }

  // MODEL_BEHAVIOR_DRIFT: violations fired but session wasn't blocked
  if (analysis.attack_detected && !hasBlocks && thread.peak_risk_score >= 40) {
    return {
      category:   'MODEL_BEHAVIOR_DRIFT',
      confidence: 0.72,
      summary:
        'Governance signals fired but the session was not blocked, suggesting the model ' +
        'deviated from its expected behavioral constraints under adversarial pressure.',
    }
  }

  // ADVERSARIAL_INPUT: attack detected AND correctly blocked
  if (analysis.attack_detected && hasBlocks) {
    return {
      category:   'ADVERSARIAL_INPUT',
      confidence: 0.92,
      summary:
        'An adversarial input was detected and correctly blocked by the governance pipeline. ' +
        'No system failure — the defense layer functioned as designed.',
    }
  }

  return {
    category:   'UNKNOWN',
    confidence: 0.50,
    summary:    'Insufficient forensic evidence to determine a definitive root cause.',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contributing factor extraction
// ─────────────────────────────────────────────────────────────────────────────

function extractContributingFactors(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): ContributingFactor[] {
  const factors: ContributingFactor[] = []
  let factorIdx = 0

  // Factor: multi-turn escalation
  if (thread.turn_count > 1 && analysis.attack_detected) {
    const onsetIdx = analysis.onset_turn_index ?? 0
    if (onsetIdx > 0) {
      factors.push({
        factor_id:   `CF-${factorIdx++}`,
        factor_type: 'MULTI_TURN_ESCALATION',
        description: `Attack onset at turn ${onsetIdx} of ${thread.turn_count}. ` +
          `${onsetIdx} benign turns preceded the first adversarial signal.`,
        weight:    0.75,
        evidence:  `Onset turn index: ${onsetIdx}. Progression: ${analysis.progression_vector.join(' → ')}.`,
      })
    }
  }

  // Factor: high peak risk
  if (thread.peak_risk_score >= 80) {
    factors.push({
      factor_id:   `CF-${factorIdx++}`,
      factor_type: 'EXTREME_RISK_SCORE',
      description: `Peak session risk score reached ${thread.peak_risk_score}/100.`,
      weight:    0.90,
      evidence:  `Peak event ID: ${analysis.peak_turn_index !== null
        ? thread.turns[analysis.peak_turn_index]?.event_id
        : 'unknown'}.`,
    })
  }

  // Factor: multiple attack vectors
  if (analysis.attack_vectors.length > 1) {
    factors.push({
      factor_id:   `CF-${factorIdx++}`,
      factor_type: 'MULTI_VECTOR_ATTACK',
      description: `${analysis.attack_vectors.length} distinct attack categories were observed: ` +
        `${analysis.attack_vectors.join(', ')}.`,
      weight:    0.80,
      evidence:  `Attack vectors: [${analysis.attack_vectors.join(', ')}].`,
    })
  }

  // Factor: no BLOCK despite attack
  if (analysis.attack_detected && !thread.has_blocks) {
    factors.push({
      factor_id:   `CF-${factorIdx++}`,
      factor_type: 'ENFORCEMENT_FAILURE',
      description: 'Attack was detected but no BLOCK decision was issued during the session.',
      weight:    0.95,
      evidence:  `Final outcome: ${thread.final_outcome}. has_blocks: false.`,
    })
  }

  // Factor: duration (long sessions suggest sustained probing)
  if (thread.duration_ms > 60_000) {
    factors.push({
      factor_id:   `CF-${factorIdx++}`,
      factor_type: 'SUSTAINED_ATTACK_DURATION',
      description: `Session lasted ${Math.round(thread.duration_ms / 1000)}s — sustained attacker persistence.`,
      weight:    0.55,
      evidence:  `duration_ms: ${thread.duration_ms}.`,
    })
  }

  return factors.sort((a, b) => b.weight - a.weight)
}

// ─────────────────────────────────────────────────────────────────────────────
// Detection gap analysis
// ─────────────────────────────────────────────────────────────────────────────

function detectGaps(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis,
  category: RootCauseCategory
): DetectionGap[] {
  const gaps: DetectionGap[] = []
  let gapIdx = 0

  if (category === 'POLICY_COVERAGE_GAP') {
    gaps.push({
      gap_id:   `GAP-${gapIdx++}`,
      gap_type: 'PATTERN_NOT_COVERED',
      description:
        'High-risk turns produced elevated scores without matching any registered detection rule. ' +
        'The attack vector is novel or uses phrasing not present in the pattern registry.',
      recommendation:
        'Review unmatched prompts and add new patterns to detectionRules.ts. ' +
        'Consider adding semantic similarity matching to supplement lexical rules.',
    })
  }

  if (category === 'CONTEXT_MANIPULATION') {
    gaps.push({
      gap_id:   `GAP-${gapIdx++}`,
      gap_type: 'MULTI_TURN_BLIND_SPOT',
      description:
        'The governance pipeline evaluated each turn in isolation. ' +
        'The progressive context poisoning attack was not detected as a multi-turn pattern.',
      recommendation:
        'Implement session-level risk aggregation that increases sensitivity ' +
        'as PROBING phase turns accumulate, triggering WARN after 2+ probing turns.',
    })
  }

  if (category === 'GUARDRAIL_BYPASS') {
    gaps.push({
      gap_id:   `GAP-${gapIdx++}`,
      gap_type: 'THRESHOLD_TOO_HIGH',
      description:
        'Attack signals were detected but the composite risk score did not reach ' +
        'the BLOCK threshold (70), allowing the session to continue.',
      recommendation:
        'Lower the BLOCK threshold for sessions in ESCALATING pattern state. ' +
        'Add a consecutive-WARN rule: 2+ WARN decisions in one session → automatic BLOCK.',
    })
  }

  // High peak risk with no violations is always a gap
  const silentHighRisk = thread.turns.some(
    t => t.risk_evaluation.risk_score >= 60 && t.violations.length === 0
  )
  if (silentHighRisk) {
    gaps.push({
      gap_id:   `GAP-${gapIdx++}`,
      gap_type: 'MISSING_RULE',
      description:
        'One or more turns produced risk scores ≥ 60 without any violation record. ' +
        'This indicates the composite engine weighted the signal but no specific rule fired.',
      recommendation:
        'Add missing analyzer rules for the unmatched attack type. ' +
        'Cross-reference the prompt text against the threat intelligence profiles.',
    })
  }

  return gaps
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence chain construction
// ─────────────────────────────────────────────────────────────────────────────

function buildEvidenceChain(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): EvidenceEntry[] {
  return analysis.phases
    .filter(p => p.phase !== 'BENIGN' || p.risk_score > 0)
    .map((phase, idx) => {
      const turn = thread.turns[phase.turn_index]
      return {
        evidence_id:  `EV-${idx}`,
        turn_index:   phase.turn_index,
        event_id:     turn?.event_id ?? '',
        timestamp:    phase.timestamp,
        description:  `Turn ${phase.turn_index}: phase=${phase.phase}, ` +
          `decision=${phase.decision}, risk=${phase.risk_score}.`,
        signal_types: phase.attack_types,
        risk_score:   phase.risk_score,
      }
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Remediation steps
// ─────────────────────────────────────────────────────────────────────────────

const REMEDIATION_MAP: Record<RootCauseCategory, RemediationStep[]> = {
  ADVERSARIAL_INPUT: [
    { step_id: 'R-1', priority: 'IMMEDIATE',   action: 'Block the attacking session and rotate session tokens.', rationale: 'Contain the actor before re-escalation.' },
    { step_id: 'R-2', priority: 'SHORT_TERM',  action: 'Flag user/IP for elevated monitoring.', rationale: 'Persistent adversarial actors retry from same origin.' },
    { step_id: 'R-3', priority: 'LONG_TERM',   action: 'Review and harden detection patterns used successfully.', rationale: 'Strengthen what worked; prevent regression.' },
  ],
  GUARDRAIL_BYPASS: [
    { step_id: 'R-1', priority: 'IMMEDIATE',   action: 'Retroactively block the session and isolate the model response.', rationale: 'The guardrail failed — treat the session as a breach.' },
    { step_id: 'R-2', priority: 'SHORT_TERM',  action: 'Lower BLOCK threshold for attack patterns observed in this session.', rationale: 'Reduce the risk score required to trigger BLOCK.' },
    { step_id: 'R-3', priority: 'SHORT_TERM',  action: 'Add consecutive-WARN rule to session-level policy.', rationale: '2+ WARNs in one session should auto-escalate to BLOCK.' },
    { step_id: 'R-4', priority: 'LONG_TERM',   action: 'Conduct full red-team of the identified bypass vector.', rationale: 'Map the full bypass surface before hardening.' },
  ],
  POLICY_COVERAGE_GAP: [
    { step_id: 'R-1', priority: 'IMMEDIATE',   action: 'Add new detection patterns for the unmatched attack vector.', rationale: 'Close the gap before the technique is reused.' },
    { step_id: 'R-2', priority: 'SHORT_TERM',  action: 'Run unmatched prompts through AI Threat Intelligence profiles.', rationale: 'Cross-reference with known attack taxonomy.' },
    { step_id: 'R-3', priority: 'LONG_TERM',   action: 'Implement semantic similarity matching to catch novel phrasing.', rationale: 'Lexical rules miss paraphrase attacks.' },
  ],
  CONTEXT_MANIPULATION: [
    { step_id: 'R-1', priority: 'IMMEDIATE',   action: 'Terminate active session and reset context window.', rationale: 'Poisoned context must be discarded.' },
    { step_id: 'R-2', priority: 'SHORT_TERM',  action: 'Implement PROBING-phase accumulation: 2+ probing turns → WARN.', rationale: 'Multi-turn attacks are invisible to per-turn evaluation.' },
    { step_id: 'R-3', priority: 'LONG_TERM',   action: 'Add cross-turn behavioral consistency checks to the pipeline.', rationale: 'Detect semantic drift in user intent across turns.' },
  ],
  MODEL_BEHAVIOR_DRIFT: [
    { step_id: 'R-1', priority: 'IMMEDIATE',   action: 'Flag model for behavioral audit and reduce autonomy.', rationale: 'Drifting model should not operate at full capability.' },
    { step_id: 'R-2', priority: 'SHORT_TERM',  action: 'Record drift snapshot in ModelDriftEngine for tracking.', rationale: 'Establish a drift baseline delta for trend analysis.' },
    { step_id: 'R-3', priority: 'LONG_TERM',   action: 'Schedule model evaluation against governance benchmark suite.', rationale: 'Confirm the model still meets the governed behavior specification.' },
  ],
  UNKNOWN: [
    { step_id: 'R-1', priority: 'SHORT_TERM',  action: 'Escalate session to human analyst for manual review.', rationale: 'Automated analysis is insufficient — human judgment required.' },
    { step_id: 'R-2', priority: 'SHORT_TERM',  action: 'Collect additional telemetry and re-run root cause analysis.', rationale: 'More data may disambiguate the failure category.' },
  ],
}

function toFailureSeverity(peak: number, hasBlocks: boolean): FailureSeverity {
  if (peak >= 90 || (hasBlocks && peak >= 80)) return 'P1'
  if (peak >= 70 || hasBlocks) return 'P2'
  if (peak >= 40) return 'P3'
  return 'P4'
}

// ─────────────────────────────────────────────────────────────────────────────
// performRootCauseAnalysis — pure function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Performs root cause analysis on a reconstructed session.
 * Pure — accepts pre-built SessionThread and SessionAttackAnalysis.
 *
 * @param thread    Reconstructed conversation thread.
 * @param analysis  Attack progression analysis for the same session.
 */
export function performRootCauseAnalysis(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis,
  org_id = ''
): RootCauseReport {
  const { category, confidence, summary } = classifyRootCause(thread, analysis)
  const factors  = extractContributingFactors(thread, analysis)
  const gaps     = detectGaps(thread, analysis, category)
  const evidence = buildEvidenceChain(thread, analysis)
  const steps    = REMEDIATION_MAP[category] ?? REMEDIATION_MAP.UNKNOWN

  const severity = toFailureSeverity(thread.peak_risk_score, thread.has_blocks)

  const analystSummary =
    `Session ${thread.session_id} was classified as [${category}] with ${Math.round(confidence * 100)}% confidence. ` +
    summary +
    (factors.length > 0
      ? ` Key contributing factors: ${factors.slice(0, 2).map(f => f.description).join('; ')}.`
      : '') +
    (gaps.length > 0
      ? ` Detection gaps identified: ${gaps.length}. Primary gap: ${gaps[0].description}`
      : '')

  return {
    report_id:           `RCA-${thread.session_id.substring(0, 8)}-${Date.now()}`,
    session_id:          thread.session_id,
    org_id:              org_id || thread.org_id,
    generated_at:        new Date().toISOString(),
    failure_severity:    severity,
    root_cause:          category,
    root_cause_summary:  summary,
    confidence,
    contributing_factors: factors,
    detection_gaps:       gaps,
    evidence_chain:       evidence,
    remediation_steps:    steps,
    analyst_summary:      analystSummary,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RootCauseEngine — database-backed service
// ─────────────────────────────────────────────────────────────────────────────

export const RootCauseEngine = {

  /**
   * Fetches and reconstructs a session, then performs full root cause analysis.
   *
   * @param sessionId  UUID of the session to analyze.
   * @param orgId      Organization identifier.
   */
  async analyzeSession(sessionId: string, orgId: string): Promise<RootCauseReport | null> {
    const result = await SessionReconstructionEngine.reconstruct(sessionId, orgId)

    if (!result) {
      logger.warn('RCA_NO_SESSION_DATA', { sessionId, orgId })
      return null
    }

    const report = performRootCauseAnalysis(result.thread, result.attack_analysis, orgId)

    logger.info('ROOT_CAUSE_ANALYSIS_COMPLETE', {
      sessionId,
      root_cause: report.root_cause,
      severity:   report.failure_severity,
      confidence: report.confidence,
    })

    return report
  },

  /** Pure function exposed for offline/test usage. */
  performRootCauseAnalysis,
}
