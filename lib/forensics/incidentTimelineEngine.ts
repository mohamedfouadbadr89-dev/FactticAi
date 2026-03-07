/**
 * Incident Timeline Engine v2.0
 *
 * Reads directly from `facttic_governance_events` — the tamper-evident ledger.
 * Groups events by session_id and constructs structured IncidentThreads that
 * surface every forensic dimension needed for incident review.
 *
 * Architecture:
 *
 *   facttic_governance_events
 *         │
 *         ├─ grouped by session_id
 *         │
 *         ▼
 *   buildIncidentTimeline(rawEvents)       ← pure, no I/O, testable
 *         │
 *         ├─ deriveIncidentId()            SHA-256(session_id)[0..15]
 *         ├─ classifySeverity()            CRITICAL / HIGH / MEDIUM / LOW
 *         ├─ detectEscalationPattern()     ESCALATING / STABLE / DESCENDING
 *         └─ extractAttackVectors()        unique rule_types from violations[]
 *         │
 *         ▼
 *   IncidentThread
 *
 *   IncidentTimelineEngine                 ← stateless service object
 *         ├─ getIncidents(orgId, opts?)
 *         ├─ getIncidentBySession(orgId, sessionId)
 *         ├─ getActiveIncidents(orgId)
 *         ├─ getSeveritySummary(orgId)
 *         └─ buildIncidentTimeline        (re-exported for offline use)
 */

import { createHash } from 'crypto'
import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Four-tier severity model aligned with the composite risk engine thresholds. */
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

/**
 * Describes how risk moved across the session.
 * Derived by comparing the first-half average risk to the second-half average.
 */
export type EscalationPattern =
  | 'ESCALATING'      // Risk rose by > 10 points across the session
  | 'DESCENDING'      // Risk fell by > 10 points (intervention/session cooling)
  | 'STABLE'          // Risk stayed within ±10 points throughout
  | 'SINGLE_EVENT'    // Only one event — no pattern to derive

/**
 * A single governance event hydrated for forensic display.
 * Sourced from one row in `facttic_governance_events`.
 */
export interface IncidentEvent {
  id: string
  session_id: string
  timestamp: number           // Unix milliseconds — ordering key
  prompt: string | null
  decision: string            // BLOCK | WARN | ALLOW
  risk_score: number          // 0-100
  violations: Violation[]
  model: string
  /** Per-event severity derived from this event's risk_score alone. */
  threat_level: IncidentSeverity
}

/**
 * Structured violation record extracted from the violations[] JSONB column.
 * Shape matches the output of buildViolation() in each analyzer module.
 */
export interface Violation {
  policy_name: string
  rule_type: string
  rule_id: string
  threshold: number
  actual_score: number
  action: string
  severity: number
  explanation: string
}

/**
 * A fully constructed incident thread: one session's worth of governance events
 * enriched with computed forensic metadata.
 */
export interface IncidentThread {
  /** Deterministic 16-char hex derived from SHA-256(session_id). Stable across queries. */
  incident_id: string
  session_id: string
  org_id: string
  /** Session-level severity — highest tier reached by any event in the thread. */
  severity: IncidentSeverity
  /** Peak risk_score across all events in this session. */
  risk_score: number
  /** Timestamp of the earliest event (Unix ms). */
  first_event_time: number
  /** Timestamp of the latest event (Unix ms). */
  last_event_time: number
  /** Elapsed time from first to last event in milliseconds. */
  duration_ms: number
  event_count: number
  /** Direction risk moved across the session. */
  escalation_pattern: EscalationPattern
  /** Unique rule_type values from all violation records — the detected attack surfaces. */
  attack_vectors: string[]
  /** ID of the event that produced the highest risk_score. */
  peak_event_id: string | null
  events: IncidentEvent[]
}

/** Filter options for getIncidents(). */
export interface IncidentQueryOptions {
  /** Max rows fetched from Supabase before grouping. Default: 500. */
  limit?: number
  /** Only return threads whose session-level severity matches one of these. */
  severity_filter?: IncidentSeverity[]
  /** Exclude events below this risk_score from the initial fetch. */
  min_risk_score?: number
  /** Only include events where decision is one of these values. */
  decision_filter?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces a stable 16-char incident identifier from the session UUID.
 * SHA-256(session_id) prefix — reproducible without a sequences table.
 */
function deriveIncidentId(session_id: string): string {
  return createHash('sha256').update(session_id).digest('hex').substring(0, 16)
}

/**
 * Maps a single event's risk_score to a per-event threat level.
 * Used to colour-code individual event rows in the UI.
 */
function classifyThreatLevel(risk_score: number): IncidentSeverity {
  if (risk_score >= 90) return 'CRITICAL'
  if (risk_score >= 70) return 'HIGH'
  if (risk_score >= 40) return 'MEDIUM'
  return 'LOW'
}

/**
 * Session-level severity — considers both peak risk and decision patterns.
 *
 * CRITICAL  risk ≥ 90, OR ≥ 2 BLOCK events, OR 1 BLOCK + risk ≥ 70
 * HIGH      risk ≥ 70, OR any BLOCK event
 * MEDIUM    risk ≥ 40, OR any WARN event
 * LOW       everything else
 */
function classifySeverity(events: IncidentEvent[]): IncidentSeverity {
  const peakRisk   = Math.max(...events.map(e => e.risk_score))
  const blockCount = events.filter(e => e.decision === 'BLOCK').length
  const hasWarn    = events.some(e => e.decision === 'WARN')

  if (peakRisk >= 90 || blockCount >= 2 || (blockCount >= 1 && peakRisk >= 70)) {
    return 'CRITICAL'
  }
  if (peakRisk >= 70 || blockCount >= 1) return 'HIGH'
  if (peakRisk >= 40 || hasWarn)         return 'MEDIUM'
  return 'LOW'
}

/**
 * Compares the first-half average risk to the second-half average.
 * A delta > +10 = ESCALATING; < -10 = DESCENDING; otherwise STABLE.
 *
 * Requires at least 2 events — returns SINGLE_EVENT when length is 1.
 */
function detectEscalationPattern(events: IncidentEvent[]): EscalationPattern {
  if (events.length <= 1) return 'SINGLE_EVENT'

  const mid          = Math.floor(events.length / 2)
  const firstHalf    = events.slice(0, mid)
  const secondHalf   = events.slice(mid)
  const firstAvg     = firstHalf.reduce((s, e) => s + e.risk_score, 0) / firstHalf.length
  const secondAvg    = secondHalf.reduce((s, e) => s + e.risk_score, 0) / secondHalf.length
  const delta        = secondAvg - firstAvg

  if (delta >  10) return 'ESCALATING'
  if (delta < -10) return 'DESCENDING'
  return 'STABLE'
}

/**
 * Flattens all violations[] arrays across the session and extracts unique
 * rule_type values — these are the distinct attack surfaces that were triggered.
 */
function extractAttackVectors(events: IncidentEvent[]): string[] {
  const vectors = new Set<string>()
  for (const event of events) {
    for (const v of event.violations) {
      const label = v.rule_type || v.policy_name || (v as any).type
      if (label) vectors.add(String(label).toUpperCase())
    }
  }
  return [...vectors].sort()
}

// ─────────────────────────────────────────────────────────────────────────────
// buildIncidentTimeline — pure helper, exported standalone
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a fully enriched IncidentThread from raw `facttic_governance_events`
 * rows. This function is pure — no database calls, no side effects.
 *
 * Can be called directly from tests, replay endpoints, or any context that
 * has already fetched the raw rows.
 *
 * Session Thread layout:
 *
 *   IncidentThread
 *     ├─ IncidentEvent  (earliest timestamp)
 *     ├─ IncidentEvent
 *     └─ IncidentEvent  (latest timestamp)
 *
 * @param rawEvents  Raw rows from `facttic_governance_events`.
 * @param org_id     Resolved org — falls back to rawEvents[0].org_id.
 * @returns          Structured IncidentThread, or null if rawEvents is empty.
 */
export function buildIncidentTimeline(
  rawEvents: Record<string, any>[],
  org_id = ''
): IncidentThread | null {
  if (!rawEvents || rawEvents.length === 0) return null

  // ── Normalize + sort chronologically ──────────────────────────────────────
  const events: IncidentEvent[] = rawEvents
    .map(row => {
      const risk_score = Number(row.risk_score) || 0
      const violations: Violation[] = Array.isArray(row.violations) ? row.violations : []

      return {
        id:           row.id,
        session_id:   row.session_id,
        timestamp:    typeof row.timestamp === 'number'
                        ? row.timestamp
                        : Number(row.timestamp),
        prompt:       row.prompt ?? null,
        decision:     row.decision,
        risk_score,
        violations,
        model:        row.model || 'unspecified',
        threat_level: classifyThreatLevel(risk_score),
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)

  // ── Derived fields ─────────────────────────────────────────────────────────
  const session_id      = events[0].session_id
  const resolvedOrgId   = org_id || String(rawEvents[0].org_id ?? '')
  const peakEvent       = events.reduce(
    (max, e) => (e.risk_score > max.risk_score ? e : max),
    events[0]
  )
  const firstEventTime  = events[0].timestamp
  const lastEventTime   = events[events.length - 1].timestamp

  return {
    incident_id:        deriveIncidentId(session_id),
    session_id,
    org_id:             resolvedOrgId,
    severity:           classifySeverity(events),
    risk_score:         peakEvent.risk_score,
    first_event_time:   firstEventTime,
    last_event_time:    lastEventTime,
    duration_ms:        lastEventTime - firstEventTime,
    event_count:        events.length,
    escalation_pattern: detectEscalationPattern(events),
    attack_vectors:     extractAttackVectors(events),
    peak_event_id:      peakEvent.id,
    events,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IncidentTimelineEngine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stateless service object for querying and constructing incident timelines.
 *
 * All methods read from `facttic_governance_events` using the Supabase
 * service-role client (bypasses RLS — authorization is enforced by the caller).
 */
export const IncidentTimelineEngine = {

  // ── getIncidents ───────────────────────────────────────────────────────────

  /**
   * Returns all incident threads for an org, ordered by first_event_time
   * descending (most recent incident first).
   *
   * Fetches up to `limit` rows from Supabase, groups by session_id, then
   * builds one IncidentThread per session. severity_filter is applied after
   * construction since session-level severity requires all events to compute.
   */
  async getIncidents(
    orgId: string,
    options: IncidentQueryOptions = {}
  ): Promise<IncidentThread[]> {
    const {
      limit          = 500,
      severity_filter,
      min_risk_score,
      decision_filter,
    } = options

    let query = supabaseServer
      .from('facttic_governance_events')
      .select('id, session_id, org_id, timestamp, prompt, decision, risk_score, violations, model')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (min_risk_score !== undefined) {
      query = query.gte('risk_score', min_risk_score)
    }
    if (decision_filter && decision_filter.length > 0) {
      query = query.in('decision', decision_filter)
    }

    const { data, error } = await query

    if (error) {
      logger.error('INCIDENT_TIMELINE_FETCH_FAILED', { orgId, error: error.message })
      return []
    }
    if (!data || data.length === 0) return []

    // Group rows by session_id
    const sessionMap = new Map<string, Record<string, any>[]>()
    for (const row of data) {
      const key = row.session_id || 'untracked'
      if (!sessionMap.has(key)) sessionMap.set(key, [])
      sessionMap.get(key)!.push(row)
    }

    // Build a thread per session
    const threads: IncidentThread[] = []
    for (const rows of sessionMap.values()) {
      const thread = buildIncidentTimeline(rows, orgId)
      if (!thread) continue
      if (severity_filter && !severity_filter.includes(thread.severity)) continue
      threads.push(thread)
    }

    logger.info('INCIDENT_TIMELINE_BUILT', {
      orgId,
      sessions: threads.length,
      rows_fetched: data.length,
    })

    return threads.sort((a, b) => b.first_event_time - a.first_event_time)
  },

  // ── getIncidentBySession ───────────────────────────────────────────────────

  /**
   * Returns the full IncidentThread for a single session.
   * Fetches all events for that session (no pagination limit).
   * Returns null if the session has no recorded events.
   */
  async getIncidentBySession(
    orgId: string,
    sessionId: string
  ): Promise<IncidentThread | null> {
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, session_id, org_id, timestamp, prompt, decision, risk_score, violations, model')
      .eq('org_id', orgId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      logger.error('INCIDENT_SESSION_FETCH_FAILED', { orgId, sessionId, error: error.message })
      return null
    }
    if (!data || data.length === 0) return null

    return buildIncidentTimeline(data, orgId)
  },

  // ── getActiveIncidents ─────────────────────────────────────────────────────

  /**
   * Returns only sessions that produced a BLOCK or WARN decision.
   * These are the actionable incidents shown in the forensics dashboard.
   */
  async getActiveIncidents(orgId: string): Promise<IncidentThread[]> {
    return this.getIncidents(orgId, {
      decision_filter: ['BLOCK', 'WARN'],
      limit: 200,
    })
  },

  // ── getSeveritySummary ─────────────────────────────────────────────────────

  /**
   * Counts incidents by severity tier.
   * Used for the summary tiles on the forensics/overview dashboard.
   *
   * Returns: { CRITICAL: n, HIGH: n, MEDIUM: n, LOW: n }
   */
  async getSeveritySummary(orgId: string): Promise<Record<IncidentSeverity, number>> {
    const threads = await this.getIncidents(orgId, { limit: 500 })

    const summary: Record<IncidentSeverity, number> = {
      CRITICAL: 0,
      HIGH:     0,
      MEDIUM:   0,
      LOW:      0,
    }
    for (const t of threads) summary[t.severity]++

    return summary
  },

  // ── buildIncidentTimeline (re-exported) ───────────────────────────────────

  /**
   * Re-exposed here so callers can import everything from a single surface.
   * Identical to the module-level export.
   */
  buildIncidentTimeline,
}
