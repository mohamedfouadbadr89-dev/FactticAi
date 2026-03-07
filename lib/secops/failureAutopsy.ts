/**
 * AI Failure Autopsy Engine
 *
 * Produces a structured post-mortem for sessions where the AI governance
 * pipeline failed — or nearly failed — to contain an adversarial interaction.
 *
 * An "autopsy" is distinct from root cause analysis:
 *   - RCA answers: WHY did this happen?
 *   - Autopsy answers: WHAT failed at each layer, HOW did it fail,
 *     and WHAT must change to prevent recurrence?
 *
 * Failure layers examined:
 *
 *   L1 — DETECTION LAYER     Did the analyzers fire the right signals?
 *   L2 — SCORING LAYER       Did the composite risk engine score correctly?
 *   L3 — DECISION LAYER      Did the pipeline reach the right BLOCK/WARN/ALLOW?
 *   L4 — ENFORCEMENT LAYER   Was the decision executed (session terminated)?
 *   L5 — BEHAVIORAL LAYER    Did the model exhibit drift under adversarial pressure?
 *
 * Autopsy output:
 *   - Per-layer failure assessment
 *   - Timeline of failure events (what happened in what order)
 *   - Failure mode classification
 *   - Confidence in the failure narrative
 *   - Prescriptive remediation per layer
 */

import {
  SessionReconstructionEngine,
  type SessionThread,
  type SessionAttackAnalysis,
  type SessionTurn,
} from '../forensics/sessionReconstructionEngine'
import { RootCauseEngine, type RootCauseReport } from './rootCauseEngine'
import { logger } from '../logger'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FailureLayer =
  | 'DETECTION'
  | 'SCORING'
  | 'DECISION'
  | 'ENFORCEMENT'
  | 'BEHAVIORAL'

export type LayerStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'UNKNOWN'

export type FailureMode =
  | 'UNDETECTED_ATTACK'        // attack completed without any signal
  | 'UNDER_SCORED'             // signals fired but risk score was too low to BLOCK
  | 'DECISION_NOT_ENFORCED'    // BLOCK recommended but session continued
  | 'MULTI_TURN_BLIND'         // per-turn OK, multi-turn pattern missed
  | 'MODEL_COMPLIANCE_FAILURE' // model responded despite BLOCK signal
  | 'FALSE_NEGATIVE'           // no violation despite clear adversarial content
  | 'THRESHOLD_MISCALIBRATION' // threshold too high for the observed attack class
  | 'BENIGN'                   // no failure — session was correctly handled

/** Assessment of one layer of the AI governance stack. */
export interface LayerAssessment {
  layer:        FailureLayer
  status:       LayerStatus
  /** What this layer was expected to do. */
  expected:     string
  /** What it actually did, based on the forensic evidence. */
  observed:     string
  failure_detail: string | null
  remediation:  string | null
}

/** One event in the autopsy timeline. */
export interface AutopsyTimelineEvent {
  sequence:    number
  timestamp:   number
  timestamp_iso: string
  event_id:    string
  turn_index:  number
  description: string
  /** Which governance layer this event relates to. */
  layer:       FailureLayer
  is_failure:  boolean
  risk_score:  number
}

export interface AutopsyReport {
  autopsy_id:        string
  session_id:        string
  org_id:            string
  generated_at:      string
  /** Summarises the failure in one sentence. */
  headline:          string
  failure_mode:      FailureMode
  failure_confirmed: boolean
  confidence:        number
  /** Ordered from most to least severe. */
  layer_assessments: LayerAssessment[]
  /** Chronological failure timeline. */
  failure_timeline:  AutopsyTimelineEvent[]
  /** Integrated root cause report. */
  root_cause:        RootCauseReport
  /** Key indicators that reveal the failure character. */
  key_indicators:    string[]
  /** Prescriptive recommendations ordered by urgency. */
  prescriptions:     Prescription[]
  /** Auto-generated full narrative for inclusion in incident reports. */
  autopsy_narrative: string
}

export interface Prescription {
  prescription_id: string
  urgency:         'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM'
  layer:           FailureLayer
  action:          string
  expected_impact: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer assessors
// ─────────────────────────────────────────────────────────────────────────────

function assessDetectionLayer(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): LayerAssessment {
  const hasAttack   = analysis.attack_detected
  const hasViolations = thread.turns.some(t => t.violations.length > 0)
  const silentHighRisk = thread.turns.some(
    t => t.risk_evaluation.risk_score >= 50 && t.violations.length === 0
  )

  if (!hasAttack && thread.peak_risk_score < 40) {
    return {
      layer:          'DETECTION',
      status:         'PASS',
      expected:       'No adversarial patterns — detection correctly silent.',
      observed:       'No signals fired. Session was benign.',
      failure_detail: null,
      remediation:    null,
    }
  }

  if (silentHighRisk) {
    return {
      layer:          'DETECTION',
      status:         'FAIL',
      expected:       'Detection rules should have fired for high-risk content.',
      observed:       `${thread.turns.filter(t => t.risk_evaluation.risk_score >= 50 && t.violations.length === 0).length} turn(s) reached risk ≥ 50 with zero violations recorded.`,
      failure_detail: 'The attack used phrasing not covered by any detection rule (false negative).',
      remediation:    'Review unmatched prompts against AI Threat Intelligence profiles. Add missing patterns.',
    }
  }

  if (hasAttack && hasViolations) {
    return {
      layer:          'DETECTION',
      status:         'PASS',
      expected:       'Detection rules fire for adversarial content.',
      observed:       `Violations recorded: ${[...new Set(thread.turns.flatMap(t => t.violations.map(v => v.rule_type)))].join(', ')}.`,
      failure_detail: null,
      remediation:    null,
    }
  }

  return {
    layer:          'DETECTION',
    status:         'PARTIAL',
    expected:       'Full detection coverage of adversarial patterns.',
    observed:       'Some adversarial turns produced no violations.',
    failure_detail: 'Partial detection coverage — some attack turns were not matched.',
    remediation:    'Expand pattern coverage in detectionRules.ts for observed attack vectors.',
  }
}

function assessScoringLayer(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): LayerAssessment {
  const peakRisk    = thread.peak_risk_score
  const hasAttack   = analysis.attack_detected
  const hasViolations = thread.turns.some(t => t.violations.length > 0)
  const blockable   = peakRisk >= 70

  if (!hasAttack) {
    return {
      layer:          'SCORING',
      status:         'PASS',
      expected:       'Composite risk engine produces low score for benign session.',
      observed:       `Peak risk score: ${peakRisk}.`,
      failure_detail: null,
      remediation:    null,
    }
  }

  if (hasViolations && !blockable) {
    return {
      layer:          'SCORING',
      status:         'FAIL',
      expected:       'Composite risk engine should score adversarial content above BLOCK threshold (70).',
      observed:       `Peak risk score was ${peakRisk} — below the 70-point BLOCK threshold despite violations.`,
      failure_detail: 'The attack was detected but under-scored. The BLOCK threshold was not reached.',
      remediation:    'Audit composite weights for the triggered signal types. Lower BLOCK threshold for multi-violation sessions.',
    }
  }

  if (blockable) {
    return {
      layer:          'SCORING',
      status:         'PASS',
      expected:       'Composite risk engine scores adversarial content above BLOCK threshold.',
      observed:       `Peak risk score: ${peakRisk} — above BLOCK threshold.`,
      failure_detail: null,
      remediation:    null,
    }
  }

  return {
    layer:          'SCORING',
    status:         'UNKNOWN',
    expected:       'Composite risk engine accurately scores adversarial content.',
    observed:       `Peak risk score: ${peakRisk}. No clear scoring failure identified.`,
    failure_detail: null,
    remediation:    null,
  }
}

function assessDecisionLayer(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): LayerAssessment {
  const peakRisk  = thread.peak_risk_score
  const hasBlocks = thread.has_blocks
  const hasAttack = analysis.attack_detected

  if (!hasAttack && !hasBlocks) {
    return {
      layer:          'DECISION',
      status:         'PASS',
      expected:       'ALLOW for benign session.',
      observed:       `Final outcome: ${thread.final_outcome}.`,
      failure_detail: null,
      remediation:    null,
    }
  }

  if (hasAttack && peakRisk >= 70 && !hasBlocks) {
    return {
      layer:          'DECISION',
      status:         'FAIL',
      expected:       'BLOCK decision for risk score ≥ 70.',
      observed:       `No BLOCK issued despite peak risk ${peakRisk}. Final outcome: ${thread.final_outcome}.`,
      failure_detail: 'The decision layer failed to issue BLOCK when the risk threshold was exceeded.',
      remediation:    'Audit governancePipeline.ts BLOCK threshold logic. Confirm composite engine output is wired to decision gate.',
    }
  }

  if (hasBlocks) {
    return {
      layer:          'DECISION',
      status:         'PASS',
      expected:       'BLOCK decision issued for high-risk adversarial session.',
      observed:       'BLOCK decision correctly issued.',
      failure_detail: null,
      remediation:    null,
    }
  }

  if (hasAttack && !hasBlocks) {
    return {
      layer:          'DECISION',
      status:         'PARTIAL',
      expected:       'WARN or BLOCK for detected attack patterns.',
      observed:       `WARN issued but no BLOCK despite detected attack. Final: ${thread.final_outcome}.`,
      failure_detail: 'Session was warned but not blocked. Attack may have continued.',
      remediation:    'Implement session-level escalation: 2+ WARNs in a session → automatic BLOCK.',
    }
  }

  return {
    layer:          'DECISION',
    status:         'UNKNOWN',
    expected:       'Appropriate decision for session risk profile.',
    observed:       `Final outcome: ${thread.final_outcome}.`,
    failure_detail: null,
    remediation:    null,
  }
}

function assessEnforcementLayer(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): LayerAssessment {
  // Enforcement = did the BLOCK actually terminate the session?
  // We infer from: was there a BLOCK followed by more turns?
  const blockTurnIndex = thread.turns.findIndex(t => t.final_decision === 'BLOCK')
  if (blockTurnIndex === -1) {
    const hasAttack = analysis.attack_detected
    return {
      layer:          'ENFORCEMENT',
      status:         hasAttack ? 'FAIL' : 'PASS',
      expected:       hasAttack ? 'BLOCK should have been enforced.' : 'No enforcement needed.',
      observed:       `No BLOCK decision was issued. Session ended with: ${thread.final_outcome}.`,
      failure_detail: hasAttack ? 'Attack completed without enforcement action.' : null,
      remediation:    hasAttack ? 'Ensure the pipeline terminates the session immediately upon BLOCK.' : null,
    }
  }

  const turnsAfterBlock = thread.turns.length - 1 - blockTurnIndex
  if (turnsAfterBlock > 0) {
    return {
      layer:          'ENFORCEMENT',
      status:         'FAIL',
      expected:       'Session terminates immediately upon BLOCK.',
      observed:       `${turnsAfterBlock} turn(s) occurred after the BLOCK decision at turn ${blockTurnIndex}.`,
      failure_detail: 'BLOCK decision was issued but the session was not terminated. Subsequent turns were processed.',
      remediation:    'Enforce session termination at the API gateway level when a BLOCK decision is returned.',
    }
  }

  return {
    layer:          'ENFORCEMENT',
    status:         'PASS',
    expected:       'Session terminates upon BLOCK.',
    observed:       `BLOCK at turn ${blockTurnIndex} was the final turn. Session correctly terminated.`,
    failure_detail: null,
    remediation:    null,
  }
}

function assessBehavioralLayer(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis
): LayerAssessment {
  const escalating = analysis.phases.length >= 2 &&
    analysis.phases[analysis.phases.length - 1].risk_score >
    analysis.phases[0].risk_score + 20

  const modelsUsed = [...new Set(thread.turns.map(t => t.model))]
  const hasModelResponse = thread.turns.some(t => t.model_response && t.model_response.length > 0)

  if (escalating) {
    return {
      layer:          'BEHAVIORAL',
      status:         'FAIL',
      expected:       'Model behavior should remain consistent under adversarial pressure.',
      observed:       `Risk score escalated from ${analysis.phases[0].risk_score} → ` +
        `${analysis.phases[analysis.phases.length - 1].risk_score} across the session.`,
      failure_detail: 'The model exhibited compliance drift — it became increasingly permissive as adversarial turns accumulated.',
      remediation:    'Implement cross-turn behavioral consistency checks. Flag sessions where the model\'s effective "boundaries" shift.',
    }
  }

  return {
    layer:          'BEHAVIORAL',
    status:         'PASS',
    expected:       'Model behavioral profile consistent with governance baseline.',
    observed:       hasModelResponse
      ? `Model responded across ${thread.turn_count} turns. Behavioral profile stable.`
      : 'No model responses recorded (likely all blocked at gateway).',
    failure_detail: null,
    remediation:    null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Failure mode classifier
// ─────────────────────────────────────────────────────────────────────────────

function classifyFailureMode(
  thread:      SessionThread,
  analysis:    SessionAttackAnalysis,
  assessments: LayerAssessment[]
): { mode: FailureMode; confirmed: boolean; confidence: number } {
  const detFail  = assessments.find(a => a.layer === 'DETECTION')?.status === 'FAIL'
  const scoreFail  = assessments.find(a => a.layer === 'SCORING')?.status === 'FAIL'
  const decFail  = assessments.find(a => a.layer === 'DECISION')?.status === 'FAIL'
  const enfFail  = assessments.find(a => a.layer === 'ENFORCEMENT')?.status === 'FAIL'
  const behFail  = assessments.find(a => a.layer === 'BEHAVIORAL')?.status === 'FAIL'

  if (!analysis.attack_detected && thread.peak_risk_score < 30) {
    return { mode: 'BENIGN', confirmed: true, confidence: 0.95 }
  }
  if (detFail) {
    return { mode: 'UNDETECTED_ATTACK', confirmed: true, confidence: 0.90 }
  }
  if (analysis.attack_pattern === 'SLOW_ESCALATION' || analysis.attack_pattern === 'RECONNAISSANCE') {
    return { mode: 'MULTI_TURN_BLIND', confirmed: true, confidence: 0.87 }
  }
  if (scoreFail) {
    return { mode: 'UNDER_SCORED', confirmed: true, confidence: 0.85 }
  }
  if (decFail) {
    return { mode: 'THRESHOLD_MISCALIBRATION', confirmed: true, confidence: 0.82 }
  }
  if (enfFail) {
    return { mode: 'DECISION_NOT_ENFORCED', confirmed: true, confidence: 0.88 }
  }
  if (behFail) {
    return { mode: 'MODEL_COMPLIANCE_FAILURE', confirmed: true, confidence: 0.80 }
  }

  return { mode: 'FALSE_NEGATIVE', confirmed: false, confidence: 0.60 }
}

// ─────────────────────────────────────────────────────────────────────────────
// Failure timeline builder
// ─────────────────────────────────────────────────────────────────────────────

function buildFailureTimeline(
  thread:   SessionThread,
  analysis: SessionAttackAnalysis,
  assessments: LayerAssessment[]
): AutopsyTimelineEvent[] {
  const timeline: AutopsyTimelineEvent[] = []
  let seq = 0

  for (const turn of thread.turns) {
    const phase = analysis.phases.find(p => p.turn_index === turn.turn_index)
    const isFailure = (
      (turn.risk_evaluation.risk_score >= 60 && turn.violations.length === 0) ||
      (turn.final_decision === 'BLOCK' && thread.turns.length > turn.turn_index + 1)
    )

    const layer: FailureLayer =
      turn.violations.length > 0 ? 'DETECTION'
      : turn.final_decision === 'BLOCK' ? 'ENFORCEMENT'
      : turn.risk_evaluation.risk_score > 0 ? 'SCORING'
      : 'BEHAVIORAL'

    timeline.push({
      sequence:     seq++,
      timestamp:    turn.timestamp,
      timestamp_iso: turn.timestamp_iso,
      event_id:     turn.event_id,
      turn_index:   turn.turn_index,
      description:  `Turn ${turn.turn_index}: ${phase?.phase ?? 'UNKNOWN'} phase. ` +
        `decision=${turn.final_decision}, risk=${turn.risk_evaluation.risk_score}` +
        (turn.violations.length > 0 ? `, violations=[${turn.violations.map(v => v.rule_type).join(',')}]` : ''),
      layer,
      is_failure:   isFailure,
      risk_score:   turn.risk_evaluation.risk_score,
    })
  }

  return timeline
}

// ─────────────────────────────────────────────────────────────────────────────
// Prescriptions builder
// ─────────────────────────────────────────────────────────────────────────────

function buildPrescriptions(
  mode:        FailureMode,
  assessments: LayerAssessment[]
): Prescription[] {
  const prescriptions: Prescription[] = []
  let idx = 0

  // Layer-specific prescriptions from assessments
  for (const assessment of assessments) {
    if (assessment.status === 'FAIL' && assessment.remediation) {
      const urgency: Prescription['urgency'] =
        assessment.layer === 'ENFORCEMENT' ? 'IMMEDIATE'
        : assessment.layer === 'DECISION'  ? 'IMMEDIATE'
        : 'SHORT_TERM'

      prescriptions.push({
        prescription_id: `RX-${idx++}`,
        urgency,
        layer:           assessment.layer,
        action:          assessment.remediation,
        expected_impact: `Resolve ${assessment.layer} layer failure. ` +
          `Expected reduction in ${assessment.failure_detail?.substring(0, 60) ?? 'failure rate'}.`,
      })
    }
  }

  // Mode-specific global prescriptions
  if (mode === 'MULTI_TURN_BLIND') {
    prescriptions.push({
      prescription_id: `RX-${idx++}`,
      urgency:         'SHORT_TERM',
      layer:           'DETECTION',
      action:          'Implement session-level attack progression detector. ' +
        'Trigger WARN after 2+ PROBING-phase turns in one session.',
      expected_impact: 'Close the multi-turn blind spot. Catch slow-escalation attacks before INJECTION phase.',
    })
  }

  if (mode === 'UNDETECTED_ATTACK') {
    prescriptions.push({
      prescription_id: `RX-${idx++}`,
      urgency:         'IMMEDIATE',
      layer:           'DETECTION',
      action:          'Run the unmatched session prompts through AIThreatScanner.scan(). ' +
        'Add missing patterns from matched indicators_of_compromise to DETECTION_RULES.',
      expected_impact: 'Close the coverage gap. Prevent same attack from bypassing detection again.',
    })
  }

  return prescriptions.sort((a, b) => {
    const order = { IMMEDIATE: 0, SHORT_TERM: 1, LONG_TERM: 2 }
    return order[a.urgency] - order[b.urgency]
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// performAutopsy — pure function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Performs a full five-layer failure autopsy on a reconstructed session.
 * Pure — accepts pre-built data objects, no I/O.
 *
 * @param thread      Reconstructed conversation thread.
 * @param analysis    Attack progression analysis.
 * @param rootCause   Root cause report for this session.
 * @param org_id      Organisation identifier.
 */
export function performAutopsy(
  thread:    SessionThread,
  analysis:  SessionAttackAnalysis,
  rootCause: RootCauseReport,
  org_id = ''
): AutopsyReport {
  const assessments: LayerAssessment[] = [
    assessDetectionLayer(thread, analysis),
    assessScoringLayer(thread, analysis),
    assessDecisionLayer(thread, analysis),
    assessEnforcementLayer(thread, analysis),
    assessBehavioralLayer(thread, analysis),
  ]

  const { mode, confirmed, confidence } = classifyFailureMode(thread, analysis, assessments)
  const timeline     = buildFailureTimeline(thread, analysis, assessments)
  const prescriptions = buildPrescriptions(mode, assessments)

  const failedLayers = assessments.filter(a => a.status === 'FAIL').map(a => a.layer)
  const keyIndicators: string[] = [
    `Peak risk score: ${thread.peak_risk_score}`,
    `Attack pattern: ${analysis.attack_pattern ?? 'None detected'}`,
    `Failed layers: ${failedLayers.length > 0 ? failedLayers.join(', ') : 'None'}`,
    `Failure mode: ${mode}`,
    `Root cause: ${rootCause.root_cause}`,
    `Confidence: ${Math.round(confidence * 100)}%`,
  ]

  const headline =
    mode === 'BENIGN'
      ? `Session ${thread.session_id.substring(0, 8)} was benign — all layers performed correctly.`
    : mode === 'UNDETECTED_ATTACK'
      ? `CRITICAL: Attack completed without triggering any detection rule.`
    : mode === 'MULTI_TURN_BLIND'
      ? `Attack succeeded by exploiting the multi-turn detection blind spot.`
    : mode === 'UNDER_SCORED'
      ? `Attack detected but risk score was too low to trigger BLOCK.`
    : mode === 'DECISION_NOT_ENFORCED'
      ? `BLOCK threshold exceeded but enforcement did not terminate the session.`
    : mode === 'MODEL_COMPLIANCE_FAILURE'
      ? `Model behavioral drift allowed adversarial session to proceed.`
    : `Governance failure in session ${thread.session_id.substring(0, 8)}.`

  const narrative =
    `AUTOPSY REPORT — Session ${thread.session_id}\n\n` +
    `HEADLINE: ${headline}\n\n` +
    `FAILURE MODE: ${mode} (${Math.round(confidence * 100)}% confidence)\n\n` +
    `LAYER FINDINGS:\n` +
    assessments.map(a => `  [${a.status.padEnd(7)}] ${a.layer}: ${a.observed}`).join('\n') +
    `\n\nROOT CAUSE: ${rootCause.root_cause_summary}\n\n` +
    `TOP PRESCRIPTIONS:\n` +
    prescriptions.slice(0, 3).map((p, i) => `  ${i + 1}. [${p.urgency}] ${p.action}`).join('\n')

  return {
    autopsy_id:        `AUT-${thread.session_id.substring(0, 8)}-${Date.now()}`,
    session_id:        thread.session_id,
    org_id:            org_id || thread.org_id,
    generated_at:      new Date().toISOString(),
    headline,
    failure_mode:      mode,
    failure_confirmed: confirmed,
    confidence,
    layer_assessments: assessments,
    failure_timeline:  timeline,
    root_cause:        rootCause,
    key_indicators:    keyIndicators,
    prescriptions,
    autopsy_narrative: narrative,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FailureAutopsyEngine — database-backed service
// ─────────────────────────────────────────────────────────────────────────────

export const FailureAutopsyEngine = {

  /**
   * Fetches a session, performs root cause analysis, and runs the full
   * five-layer autopsy. Returns a complete AutopsyReport.
   *
   * @param sessionId  UUID of the session to autopsy.
   * @param orgId      Organisation identifier.
   */
  async perform(sessionId: string, orgId: string): Promise<AutopsyReport | null> {
    const [reconstructed, rootCause] = await Promise.all([
      SessionReconstructionEngine.reconstruct(sessionId, orgId),
      RootCauseEngine.analyzeSession(sessionId, orgId),
    ])

    if (!reconstructed || !rootCause) {
      logger.warn('AUTOPSY_MISSING_DATA', { sessionId, orgId })
      return null
    }

    const report = performAutopsy(
      reconstructed.thread,
      reconstructed.attack_analysis,
      rootCause,
      orgId
    )

    logger.info('AUTOPSY_COMPLETE', {
      sessionId,
      failure_mode:  report.failure_mode,
      confirmed:     report.failure_confirmed,
      confidence:    report.confidence,
      failed_layers: report.layer_assessments.filter(a => a.status === 'FAIL').map(a => a.layer),
    })

    return report
  },

  /** Pure function exposed for offline/test use. */
  performAutopsy,
}
