/**
 * Session Reconstruction Engine v1.0
 *
 * Reads raw governance events from `facttic_governance_events` and
 * reconstructs a fully structured conversation timeline with forensic
 * attack-progression analysis.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   facttic_governance_events (raw ledger rows)
 *         │
 *         ▼
 *   reconstructThread(rawEvents)          ← pure, no I/O
 *         │
 *         ├─ SessionTurn[]                per-row: prompt + response + risk + violations + decision
 *         └─ SessionThread                ordered thread with session metadata
 *
 *   analyzeAttackProgression(thread)      ← pure, no I/O
 *         │
 *         ├─ classifyPhase(turn)          BENIGN | PROBING | INJECTION | EXFILTRATION | ESCALATION
 *         ├─ buildProgressionVector()     e.g. ['BENIGN','PROBING','INJECTION','EXFILTRATION']
 *         ├─ detectPattern()              named multi-step attack pattern
 *         └─ SessionAttackAnalysis
 *
 *   SessionReconstructionEngine           ← stateless service (fetches from DB)
 *         ├─ reconstruct(sessionId)       full reconstruction + attack analysis
 *         ├─ reconstructFromEvents(rows)  pure path — supply pre-fetched rows
 *         └─ batchReconstruct(sessionIds) parallel reconstruction of multiple sessions
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Attack Phase Model
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   BENIGN       No violations, risk < 20. Normal interaction.
 *   PROBING      Low-severity boundary testing: role manipulation, system
 *                prompt extraction, ambiguous probing prompts.
 *   INJECTION    Active attack: prompt injection, policy override, tool
 *                hijacking. Risk 50–74 or WARN decision.
 *   EXFILTRATION High-severity: data exfiltration, jailbreak, system prompt
 *                disclosure. Risk ≥ 75 or BLOCK decision.
 *   ESCALATION   Any BLOCK decision not already classified above.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Attack Pattern Taxonomy
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   SLOW_ESCALATION       BENIGN → PROBING → INJECTION → EXFILTRATION
 *                         Classic multi-step attack designed to avoid detection
 *                         by starting with benign turns.
 *
 *   DIRECT_ATTACK         First non-BENIGN turn is INJECTION or EXFILTRATION.
 *                         No probing phase — attacker acts immediately.
 *
 *   RECONNAISSANCE        Only PROBING turns, never escalates.
 *                         Attacker mapping boundaries without triggering BLOCK.
 *
 *   JAILBREAK_CHAIN       Consecutive INJECTION/EXFILTRATION turns dominated
 *                         by JAILBREAK_ATTEMPTS violations — repeated attempts
 *                         with progressively varied phrasing.
 *
 *   POLICY_BYPASS_ATTEMPT Turns dominated by POLICY_OVERRIDE and
 *                         ROLE_MANIPULATION violations — focused on disabling
 *                         the governance layer before escalating.
 *
 *   MIXED_VECTOR_ATTACK   ≥ 3 distinct attack categories across the session.
 *                         Attacker rotates techniques to find a gap.
 *
 *   SINGLE_VIOLATION      Only one non-BENIGN turn. Isolated attempt.
 */

import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

// ─────────────────────────────────────────────────────────────────────────────
// Supporting types
// ─────────────────────────────────────────────────────────────────────────────

export interface TurnViolation {
  policy_name: string
  rule_type:   string
  rule_id:     string
  threshold:   number
  actual_score: number
  action:      string
  severity:    number
  explanation: string
}

export interface RiskEvaluation {
  risk_score:      number        // 0-100
  severity_level:  'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  guardrail_signals: Record<string, any>
  latency_ms:      number
}

/**
 * One fully reconstructed conversation turn.
 * Maps 1:1 to a row in `facttic_governance_events`.
 */
export interface SessionTurn {
  /** turn_index is 0-based chronological position within the session. */
  turn_index:      number
  event_id:        string
  session_id:      string
  timestamp:       number          // Unix ms
  timestamp_iso:   string          // Human-readable ISO-8601
  prompt:          string | null
  model_response:  string | null
  model:           string
  risk_evaluation: RiskEvaluation
  violations:      TurnViolation[]
  final_decision:  string          // BLOCK | WARN | ALLOW
  event_hash:      string | null   // Cryptographic integrity anchor
}

/**
 * Full reconstructed conversation thread for one session.
 */
export interface SessionThread {
  session_id:       string
  org_id:           string
  turn_count:       number
  first_timestamp:  number
  last_timestamp:   number
  duration_ms:      number
  peak_risk_score:  number
  final_outcome:    string   // Decision of the last turn
  has_blocks:       boolean
  has_warns:        boolean
  turns:            SessionTurn[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Attack analysis types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Threat classification for one turn within the session.
 * Each phase maps to a distinct attacker behavior pattern.
 */
export type PhaseLabel =
  | 'BENIGN'        // No threat signals
  | 'PROBING'       // Low-level boundary mapping
  | 'INJECTION'     // Active exploitation attempt
  | 'EXFILTRATION'  // Data extraction or jailbreak
  | 'ESCALATION'    // Catch-all BLOCK not classified above

export type AttackPattern =
  | 'SLOW_ESCALATION'        // Full BENIGN → PROBING → INJECTION → EXFILTRATION chain
  | 'DIRECT_ATTACK'          // Skips probing, opens with high-risk turn
  | 'RECONNAISSANCE'         // Probing only — attacker mapping limits, never escalating
  | 'JAILBREAK_CHAIN'        // Multiple jailbreak attempts in sequence
  | 'POLICY_BYPASS_ATTEMPT'  // Focused on disabling governance before escalating
  | 'MIXED_VECTOR_ATTACK'    // ≥ 3 distinct attack categories in one session
  | 'SINGLE_VIOLATION'       // Isolated — only one non-benign turn

/**
 * Per-turn threat classification produced by `analyzeAttackProgression`.
 */
export interface AttackPhase {
  turn_index:   number
  timestamp:    number
  phase:        PhaseLabel
  /** Specific rule_types that drove this turn's classification. */
  attack_types: string[]
  risk_score:   number
  decision:     string
}

/**
 * Full attack progression analysis for one session.
 * Primary output of `analyzeAttackProgression`.
 */
export interface SessionAttackAnalysis {
  session_id:         string
  attack_detected:    boolean
  /** Named attack pattern, or null when no attack is detected. */
  attack_pattern:     AttackPattern | null
  phases:             AttackPhase[]
  /** Compressed de-duplicated progression vector, e.g. ['BENIGN','PROBING','INJECTION']. */
  progression_vector: PhaseLabel[]
  /**
   * Turn index where the first non-BENIGN phase was detected.
   * null when the session is entirely benign.
   */
  onset_turn_index:   number | null
  /** Turn index with the highest risk_score. */
  peak_turn_index:    number | null
  /**
   * All distinct attack categories observed across the session.
   * Sourced from violation rule_type values.
   */
  attack_vectors:     string[]
  /**
   * Confidence the pattern label is correctly assigned.
   * 0.90+ = strong match; 0.70–0.89 = partial; < 0.70 = ambiguous.
   */
  confidence:         number
  recommended_action: string
}

/**
 * Combined output from a full session reconstruction call.
 */
export interface SessionReconstructionResult {
  thread:          SessionThread
  attack_analysis: SessionAttackAnalysis
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase signal sets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rule types that classify a turn as EXFILTRATION.
 * These are the highest-severity signals — attacker is actively extracting.
 */
const EXFILTRATION_TYPES = new Set([
  'DATA_EXFILTRATION',
  'JAILBREAK_ATTEMPTS',
  'SYSTEM_PROMPT_DISCLOSURE',
  'SENSITIVE_DATA',
  'SYSTEM_PROMPT_EXTRACTION',
])

/**
 * Rule types that classify a turn as INJECTION.
 * Active exploitation of the governance layer or prompt structure.
 */
const INJECTION_TYPES = new Set([
  'PROMPT_INJECTION',
  'POLICY_OVERRIDE',
  'TOOL_HIJACKING',
])

/**
 * Rule types that classify a turn as PROBING.
 * Low-severity testing of boundaries and role constraints.
 */
const PROBING_TYPES = new Set([
  'ROLE_MANIPULATION',
])

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function toSeverityLevel(risk: number): RiskEvaluation['severity_level'] {
  if (risk >= 90) return 'CRITICAL'
  if (risk >= 70) return 'HIGH'
  if (risk >= 40) return 'MEDIUM'
  return 'LOW'
}

function normalizeViolations(raw: any): TurnViolation[] {
  if (!Array.isArray(raw)) return []
  return raw.map(v => ({
    policy_name:  String(v.policy_name || ''),
    rule_type:    String(v.rule_type   || ''),
    rule_id:      String(v.rule_id     || ''),
    threshold:    Number(v.threshold   || 0),
    actual_score: Number(v.actual_score || v.severity || 0),
    action:       String(v.action       || ''),
    severity:     Number(v.severity     || 0),
    explanation:  String(v.explanation  || ''),
  }))
}

/**
 * Classifies one turn into a PhaseLabel based on its violations and risk_score.
 * Priority order: EXFILTRATION > INJECTION > PROBING > ESCALATION > BENIGN.
 */
function classifyPhase(turn: SessionTurn): PhaseLabel {
  const ruleTypes = turn.violations.map(v => v.rule_type.toUpperCase())

  // EXFILTRATION — highest priority
  if (
    ruleTypes.some(t => EXFILTRATION_TYPES.has(t)) ||
    turn.risk_evaluation.risk_score >= 75
  ) {
    return 'EXFILTRATION'
  }

  // INJECTION — active policy or prompt attack
  if (
    ruleTypes.some(t => INJECTION_TYPES.has(t)) ||
    (turn.risk_evaluation.risk_score >= 50 && turn.final_decision !== 'ALLOW')
  ) {
    return 'INJECTION'
  }

  // PROBING — boundary reconnaissance
  if (
    ruleTypes.some(t => PROBING_TYPES.has(t)) ||
    (turn.risk_evaluation.risk_score >= 20 && turn.violations.length > 0)
  ) {
    return 'PROBING'
  }

  // ESCALATION — BLOCK decision not already covered
  if (turn.final_decision === 'BLOCK') return 'ESCALATION'

  return 'BENIGN'
}

/**
 * Compresses a phase array into a deduplicated consecutive-phase vector.
 * ['BENIGN','BENIGN','PROBING','PROBING','INJECTION'] → ['BENIGN','PROBING','INJECTION']
 */
function compressVector(phases: PhaseLabel[]): PhaseLabel[] {
  const out: PhaseLabel[] = []
  for (const p of phases) {
    if (out.length === 0 || out[out.length - 1] !== p) out.push(p)
  }
  return out
}

/**
 * Counts distinct attack type categories present across all phases.
 */
function gatherAttackVectors(phases: AttackPhase[]): string[] {
  const seen = new Set<string>()
  for (const p of phases) {
    for (const t of p.attack_types) seen.add(t)
  }
  return [...seen].sort()
}

/**
 * Maps the progression vector and phase metadata to a named AttackPattern.
 * Returns { pattern, confidence }.
 */
function detectPattern(
  vector: PhaseLabel[],
  phases: AttackPhase[],
  attackVectors: string[]
): { pattern: AttackPattern; confidence: number } {

  const nonBenign = phases.filter(p => p.phase !== 'BENIGN')

  // No attack
  if (nonBenign.length === 0) {
    return { pattern: 'SINGLE_VIOLATION', confidence: 1.0 }
  }

  // SINGLE_VIOLATION — only one non-benign turn
  if (nonBenign.length === 1) {
    return { pattern: 'SINGLE_VIOLATION', confidence: 0.92 }
  }

  // JAILBREAK_CHAIN — consecutive high-severity turns dominated by jailbreak rule types
  const jailbreakTurns = nonBenign.filter(p =>
    p.attack_types.some(t => EXFILTRATION_TYPES.has(t)) &&
    (p.phase === 'INJECTION' || p.phase === 'EXFILTRATION')
  )
  if (jailbreakTurns.length >= 2 && jailbreakTurns.length / nonBenign.length >= 0.6) {
    return { pattern: 'JAILBREAK_CHAIN', confidence: 0.88 }
  }

  // POLICY_BYPASS_ATTEMPT — dominated by POLICY_OVERRIDE + ROLE_MANIPULATION
  const bypassTypes = new Set(['POLICY_OVERRIDE', 'ROLE_MANIPULATION'])
  const bypassTurns = nonBenign.filter(p =>
    p.attack_types.some(t => bypassTypes.has(t))
  )
  if (bypassTurns.length >= 2 && bypassTurns.length / nonBenign.length >= 0.6) {
    return { pattern: 'POLICY_BYPASS_ATTEMPT', confidence: 0.86 }
  }

  // SLOW_ESCALATION — full chain present in the compressed vector
  const hasProbing     = vector.includes('PROBING')
  const hasInjection   = vector.includes('INJECTION')
  const hasExfil       = vector.includes('EXFILTRATION') || vector.includes('ESCALATION')
  const startsBenign   = vector[0] === 'BENIGN'
  if (startsBenign && hasProbing && (hasInjection || hasExfil)) {
    // Check ordering: BENIGN comes before PROBING which comes before INJECTION/EXFIL
    const pIdx = vector.indexOf('PROBING')
    const iIdx = Math.min(
      vector.indexOf('INJECTION') === -1 ? Infinity : vector.indexOf('INJECTION'),
      vector.indexOf('EXFILTRATION') === -1 ? Infinity : vector.indexOf('EXFILTRATION'),
      vector.indexOf('ESCALATION') === -1 ? Infinity : vector.indexOf('ESCALATION'),
    )
    if (pIdx !== -1 && pIdx < iIdx) {
      return { pattern: 'SLOW_ESCALATION', confidence: 0.93 }
    }
  }

  // RECONNAISSANCE — probing only, never escalated
  if (hasProbing && !hasInjection && !hasExfil) {
    return { pattern: 'RECONNAISSANCE', confidence: 0.90 }
  }

  // DIRECT_ATTACK — first non-BENIGN phase is INJECTION or EXFILTRATION
  const firstNonBenign = vector.find(p => p !== 'BENIGN')
  if (firstNonBenign === 'INJECTION' || firstNonBenign === 'EXFILTRATION') {
    return { pattern: 'DIRECT_ATTACK', confidence: 0.87 }
  }

  // MIXED_VECTOR_ATTACK — ≥ 3 distinct attack categories
  if (attackVectors.length >= 3) {
    return { pattern: 'MIXED_VECTOR_ATTACK', confidence: 0.82 }
  }

  // Fallback — something was detected but doesn't fit a clean pattern
  return { pattern: 'MIXED_VECTOR_ATTACK', confidence: 0.65 }
}

// ─────────────────────────────────────────────────────────────────────────────
// reconstructThread — pure function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a SessionThread from raw `facttic_governance_events` rows.
 *
 * This function is pure — no I/O, no side effects.
 * Each raw row becomes one SessionTurn with the full SessionThread structure:
 *
 *   SessionThread
 *     ├── SessionTurn [0]
 *     │     ├── Prompt
 *     │     ├── Model Response
 *     │     ├── Risk Evaluation
 *     │     ├── Violations
 *     │     └── Final Decision
 *     ├── SessionTurn [1]
 *     └── ...
 *
 * @param rawEvents  Rows from `facttic_governance_events`, any order.
 * @param org_id     Optional — falls back to rawEvents[0].org_id.
 */
export function reconstructThread(
  rawEvents: Record<string, any>[],
  org_id = ''
): SessionThread | null {
  if (!rawEvents || rawEvents.length === 0) return null

  // Sort chronologically
  const sorted = [...rawEvents].sort((a, b) => {
    return Number(a.timestamp) - Number(b.timestamp)
  })

  const turns: SessionTurn[] = sorted.map((row, index) => {
    const riskScore  = Number(row.risk_score) || 0
    const timestamp  = typeof row.timestamp === 'number'
      ? row.timestamp
      : Number(row.timestamp)

    return {
      turn_index:     index,
      event_id:       row.id,
      session_id:     row.session_id,
      timestamp,
      timestamp_iso:  new Date(timestamp).toISOString(),
      prompt:         row.prompt ?? null,
      model_response: row.model_response ?? null,
      model:          row.model || 'unspecified',
      risk_evaluation: {
        risk_score:       riskScore,
        severity_level:   toSeverityLevel(riskScore),
        guardrail_signals: row.guardrail_signals ?? {},
        latency_ms:       Number(row.latency) || 0,
      },
      violations:     normalizeViolations(row.violations),
      final_decision: row.decision || 'UNKNOWN',
      event_hash:     row.event_hash ?? null,
    }
  })

  const firstTurn = turns[0]
  const lastTurn  = turns[turns.length - 1]
  const riskScores = turns.map(t => t.risk_evaluation.risk_score)

  return {
    session_id:      firstTurn.session_id,
    org_id:          org_id || String(rawEvents[0].org_id ?? ''),
    turn_count:      turns.length,
    first_timestamp: firstTurn.timestamp,
    last_timestamp:  lastTurn.timestamp,
    duration_ms:     lastTurn.timestamp - firstTurn.timestamp,
    peak_risk_score: Math.max(...riskScores),
    final_outcome:   lastTurn.final_decision,
    has_blocks:      turns.some(t => t.final_decision === 'BLOCK'),
    has_warns:       turns.some(t => t.final_decision === 'WARN'),
    turns,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// analyzeAttackProgression — pure function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes a reconstructed SessionThread for multi-step attack patterns.
 *
 * For each turn:
 *   1. Classifies it into a PhaseLabel (BENIGN / PROBING / INJECTION / EXFILTRATION / ESCALATION)
 *   2. Records which rule_types drove the classification
 *
 * Then:
 *   3. Builds a compressed progression vector
 *   4. Identifies the named attack pattern
 *   5. Locates onset turn (first deviation from BENIGN)
 *   6. Computes confidence
 *
 * Example output for a slow-escalation session:
 *
 *   progression_vector: ['BENIGN', 'PROBING', 'INJECTION', 'EXFILTRATION']
 *   attack_pattern: 'SLOW_ESCALATION'
 *   onset_turn_index: 1
 *   confidence: 0.93
 *
 * @param thread  A SessionThread produced by reconstructThread().
 */
export function analyzeAttackProgression(thread: SessionThread): SessionAttackAnalysis {
  const phases: AttackPhase[] = thread.turns.map(turn => {
    const phase = classifyPhase(turn)
    const attackTypes = turn.violations
      .map(v => v.rule_type.toUpperCase())
      .filter(Boolean)

    return {
      turn_index:   turn.turn_index,
      timestamp:    turn.timestamp,
      phase,
      attack_types: attackTypes,
      risk_score:   turn.risk_evaluation.risk_score,
      decision:     turn.final_decision,
    }
  })

  const rawVector       = phases.map(p => p.phase)
  const vector          = compressVector(rawVector)
  const attackVectors   = gatherAttackVectors(phases)
  const attackDetected  = phases.some(p => p.phase !== 'BENIGN')

  const onsetPhase      = phases.find(p => p.phase !== 'BENIGN')
  const onsetTurnIndex  = onsetPhase?.turn_index ?? null

  const peakPhase       = phases.reduce<AttackPhase | null>(
    (max, p) => (max === null || p.risk_score > max.risk_score ? p : max),
    null
  )
  const peakTurnIndex   = peakPhase?.turn_index ?? null

  let pattern: AttackPattern | null = null
  let confidence = 0

  if (attackDetected) {
    const result = detectPattern(vector, phases, attackVectors)
    pattern      = result.pattern
    confidence   = result.confidence
  }

  const recommendedAction = !attackDetected
    ? 'No action required — session is entirely benign.'
    : pattern === 'SLOW_ESCALATION'
    ? 'Escalate to incident response. Full attack chain confirmed. Block user/session and preserve ledger evidence.'
    : pattern === 'JAILBREAK_CHAIN'
    ? 'Immediate BLOCK. Repeated jailbreak attempts indicate persistent adversarial actor. File incident report.'
    : pattern === 'DIRECT_ATTACK'
    ? 'Immediate BLOCK. Session opened with a high-severity attack — no probing phase suggests automated tooling.'
    : pattern === 'RECONNAISSANCE'
    ? 'Monitor and flag. Attacker is mapping boundaries. Increase detection sensitivity for this session/user.'
    : pattern === 'POLICY_BYPASS_ATTEMPT'
    ? 'Block and audit. Governance layer was specifically targeted. Review policy configuration for hardening.'
    : pattern === 'MIXED_VECTOR_ATTACK'
    ? 'Block and escalate. Multi-surface attack indicates a sophisticated actor rotating techniques.'
    : 'Review. Single violation — assess whether isolated or part of a broader campaign.'

  return {
    session_id:        thread.session_id,
    attack_detected:   attackDetected,
    attack_pattern:    pattern,
    phases,
    progression_vector: vector,
    onset_turn_index:  onsetTurnIndex,
    peak_turn_index:   peakTurnIndex,
    attack_vectors:    attackVectors,
    confidence,
    recommended_action: recommendedAction,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionReconstructionEngine — stateful service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stateless service that fetches raw events and runs the full
 * reconstruction + attack analysis pipeline.
 *
 * All DB access uses the Supabase service-role client (bypasses RLS).
 * Callers are responsible for authorisation before invoking these methods.
 */
export const SessionReconstructionEngine = {

  // ── reconstruct ──────────────────────────────────────────────────────────

  /**
   * Fetches all governance events for a session and returns the full
   * SessionReconstructionResult: thread + attack analysis.
   *
   * @param sessionId  UUID of the session to reconstruct.
   * @param orgId      Optional — used for org_id resolution in the thread.
   */
  async reconstruct(
    sessionId: string,
    orgId = ''
  ): Promise<SessionReconstructionResult | null> {
    const { data: rawEvents, error } = await supabaseServer
      .from('facttic_governance_events')
      .select(
        'id, session_id, org_id, timestamp, prompt, model_response, model, ' +
        'decision, risk_score, violations, guardrail_signals, latency, event_hash'
      )
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      logger.error('SESSION_RECONSTRUCTION_FETCH_FAILED', {
        sessionId,
        error: error.message,
      })
      return null
    }

    if (!rawEvents || rawEvents.length === 0) {
      logger.warn('SESSION_RECONSTRUCTION_EMPTY', { sessionId })
      return null
    }

    return this.reconstructFromEvents(rawEvents, orgId)
  },

  // ── reconstructFromEvents ────────────────────────────────────────────────

  /**
   * Pure reconstruction path — accepts already-fetched rows.
   * No database calls. Useful for replay endpoints, tests, or offline analysis.
   *
   * @param rawEvents  Rows from `facttic_governance_events`.
   * @param orgId      Optional org_id.
   */
  reconstructFromEvents(
    rawEvents: Record<string, any>[],
    orgId = ''
  ): SessionReconstructionResult | null {
    const thread = reconstructThread(rawEvents, orgId)
    if (!thread) return null

    const attack_analysis = analyzeAttackProgression(thread)

    logger.info('SESSION_RECONSTRUCTED', {
      session_id:     thread.session_id,
      turn_count:     thread.turn_count,
      attack_detected: attack_analysis.attack_detected,
      pattern:        attack_analysis.attack_pattern,
      confidence:     attack_analysis.confidence,
    })

    return { thread, attack_analysis }
  },

  // ── batchReconstruct ─────────────────────────────────────────────────────

  /**
   * Reconstructs multiple sessions in parallel.
   * Returns only successfully reconstructed results — failed sessions are
   * logged and skipped rather than aborting the batch.
   *
   * @param sessionIds  Array of session UUIDs.
   * @param orgId       Optional org_id applied to all sessions.
   */
  async batchReconstruct(
    sessionIds: string[],
    orgId = ''
  ): Promise<SessionReconstructionResult[]> {
    const results = await Promise.allSettled(
      sessionIds.map(id => this.reconstruct(id, orgId))
    )

    const succeeded: SessionReconstructionResult[] = []
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value !== null) {
        succeeded.push(r.value)
      }
    }

    logger.info('BATCH_RECONSTRUCTION_COMPLETE', {
      requested: sessionIds.length,
      succeeded: succeeded.length,
      failed:    sessionIds.length - succeeded.length,
    })

    return succeeded
  },

  // ── Re-exported pure functions ────────────────────────────────────────────

  /** Build a thread from raw rows without hitting the database. */
  reconstructThread,

  /** Run attack analysis on an existing SessionThread. */
  analyzeAttackProgression,
}
