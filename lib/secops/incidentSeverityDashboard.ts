/**
 * Incident Severity Dashboard
 *
 * Aggregates live incident data into a single dashboard-ready snapshot.
 * Designed to power the SecOps overview screen — all data is pre-computed
 * so the UI performs no aggregation logic.
 *
 * Dashboard sections:
 *
 *   SEVERITY SUMMARY     CRITICAL / HIGH / MEDIUM / LOW counts + totals
 *   RISK TREND           30-day rolling average risk score per day
 *   ACTIVE INCIDENTS     BLOCK/WARN events in the last 24 hours
 *   TOP ATTACK VECTORS   Most frequent violation rule_types across all incidents
 *   DECISION BREAKDOWN   BLOCK / WARN / ALLOW distribution
 *   ALERT HEATMAP        Alert frequency by hour-of-day (UTC)
 *   MTTR                 Mean time to resolve (last 50 BLOCK events, hours)
 */

import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'
import {
  IncidentTimelineEngine,
  type IncidentSeverity,
  type IncidentThread,
} from '../forensics/incidentTimelineEngine'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SeveritySummary {
  CRITICAL: number
  HIGH:     number
  MEDIUM:   number
  LOW:      number
  total:    number
}

export interface RiskTrendPoint {
  date:           string    // ISO date: YYYY-MM-DD
  avg_risk_score: number
  event_count:    number
  block_count:    number
}

export interface ActiveIncident {
  incident_id:     string
  session_id:      string
  severity:        IncidentSeverity
  risk_score:      number
  first_event_time: number
  event_count:     number
  attack_vectors:  string[]
  decision:        string    // worst decision in session
}

export interface AttackVectorSummary {
  rule_type:   string
  count:       number
  /** Percentage of all violation records this vector represents. */
  share_pct:   number
  avg_severity: number
}

export interface DecisionBreakdown {
  BLOCK:  number
  WARN:   number
  ALLOW:  number
  total:  number
  block_pct: number
  warn_pct:  number
  allow_pct: number
}

/** Alert frequency by hour of day (0–23 UTC), for a heatmap widget. */
export interface AlertHeatmapPoint {
  hour:        number
  alert_count: number
}

export interface DashboardSnapshot {
  org_id:          string
  generated_at:    string
  /** Seconds to compute the snapshot. */
  build_time_ms:   number
  severity_summary: SeveritySummary
  active_incidents: ActiveIncident[]
  risk_trend:      RiskTrendPoint[]
  top_attack_vectors: AttackVectorSummary[]
  decision_breakdown: DecisionBreakdown
  alert_heatmap:   AlertHeatmapPoint[]
  /** Mean time to resolve in hours (last 50 BLOCK events). */
  mttr_hours:      number | null
  /** Number of sessions that saw escalating risk patterns. */
  escalating_sessions: number
  /** Peak risk score recorded across the entire visible window. */
  global_peak_risk: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toDateString(ts: number): string {
  return new Date(ts).toISOString().split('T')[0]
}

function pct(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// buildDashboardSnapshot — pure function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a DashboardSnapshot from pre-fetched incidents and raw events.
 * Pure — no database calls.
 */
export function buildDashboardSnapshot(
  incidents:   IncidentThread[],
  rawEvents:   Array<{ risk_score: number; decision: string; violations: any[]; timestamp: number }>,
  alertRows:   Array<{ fired_at: string }>,
  orgId:       string,
  startMs:     number
): DashboardSnapshot {
  const now = Date.now()

  // ── Severity summary ───────────────────────────────────────────────────────
  const sevCounts: SeveritySummary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, total: incidents.length }
  for (const inc of incidents) sevCounts[inc.severity]++

  // ── Active incidents (last 24 h) ───────────────────────────────────────────
  const cutoff24h = now - 86_400_000
  const active: ActiveIncident[] = incidents
    .filter(inc => inc.first_event_time >= cutoff24h)
    .map(inc => ({
      incident_id:      inc.incident_id,
      session_id:       inc.session_id,
      severity:         inc.severity,
      risk_score:       inc.risk_score,
      first_event_time: inc.first_event_time,
      event_count:      inc.event_count,
      attack_vectors:   inc.attack_vectors,
      decision:         inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'BLOCK' : inc.severity === 'MEDIUM' ? 'WARN' : 'ALLOW',
    }))
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 20)

  // ── Risk trend (30 days) ───────────────────────────────────────────────────
  const trendMap = new Map<string, { sum: number; count: number; blocks: number }>()
  const cutoff30d = now - 30 * 86_400_000
  for (const ev of rawEvents) {
    if (ev.timestamp < cutoff30d) continue
    const day = toDateString(ev.timestamp)
    if (!trendMap.has(day)) trendMap.set(day, { sum: 0, count: 0, blocks: 0 })
    const entry = trendMap.get(day)!
    entry.sum += ev.risk_score
    entry.count++
    if (ev.decision === 'BLOCK') entry.blocks++
  }
  const riskTrend: RiskTrendPoint[] = [...trendMap.entries()]
    .map(([date, data]) => ({
      date,
      avg_risk_score: Math.round(data.sum / data.count),
      event_count:    data.count,
      block_count:    data.blocks,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── Top attack vectors ─────────────────────────────────────────────────────
  const vectorMap = new Map<string, { count: number; totalSev: number }>()
  let totalViolations = 0
  for (const ev of rawEvents) {
    for (const v of Array.isArray(ev.violations) ? ev.violations : []) {
      const ruleType = String(v.rule_type || v.policy_name || 'UNKNOWN').toUpperCase()
      if (!vectorMap.has(ruleType)) vectorMap.set(ruleType, { count: 0, totalSev: 0 })
      const entry = vectorMap.get(ruleType)!
      entry.count++
      entry.totalSev += Number(v.severity || 0)
      totalViolations++
    }
  }
  const topAttackVectors: AttackVectorSummary[] = [...vectorMap.entries()]
    .map(([rule_type, data]) => ({
      rule_type,
      count:        data.count,
      share_pct:    pct(data.count, totalViolations),
      avg_severity: data.count > 0 ? Math.round((data.totalSev / data.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // ── Decision breakdown ─────────────────────────────────────────────────────
  const blocks = rawEvents.filter(e => e.decision === 'BLOCK').length
  const warns  = rawEvents.filter(e => e.decision === 'WARN').length
  const allows = rawEvents.filter(e => e.decision === 'ALLOW').length
  const total  = rawEvents.length
  const decisionBreakdown: DecisionBreakdown = {
    BLOCK: blocks, WARN: warns, ALLOW: allows, total,
    block_pct: pct(blocks, total),
    warn_pct:  pct(warns,  total),
    allow_pct: pct(allows, total),
  }

  // ── Alert heatmap (hour-of-day UTC) ───────────────────────────────────────
  const heatmap = Array.from({ length: 24 }, (_, h) => ({ hour: h, alert_count: 0 }))
  for (const row of alertRows) {
    const hour = new Date(row.fired_at).getUTCHours()
    heatmap[hour].alert_count++
  }

  // ── Escalating sessions ────────────────────────────────────────────────────
  const escalatingSessions = incidents.filter(i => i.escalation_pattern === 'ESCALATING').length

  // ── Global peak risk ──────────────────────────────────────────────────────
  const globalPeakRisk = rawEvents.length > 0
    ? Math.max(...rawEvents.map(e => e.risk_score))
    : 0

  // ── MTTR (estimate: average latency between first and last BLOCK in a session) ─
  const blockSessions = incidents.filter(i => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.duration_ms > 0)
  const mttrHours = blockSessions.length > 0
    ? Math.round(
        (blockSessions.reduce((s, i) => s + i.duration_ms, 0) / blockSessions.length) / 3_600_000 * 10
      ) / 10
    : null

  return {
    org_id:           orgId,
    generated_at:     new Date().toISOString(),
    build_time_ms:    Date.now() - startMs,
    severity_summary:  sevCounts,
    active_incidents:  active,
    risk_trend:        riskTrend,
    top_attack_vectors: topAttackVectors,
    decision_breakdown: decisionBreakdown,
    alert_heatmap:     heatmap,
    mttr_hours:        mttrHours,
    escalating_sessions: escalatingSessions,
    global_peak_risk:  globalPeakRisk,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IncidentSeverityDashboard — database-backed service
// ─────────────────────────────────────────────────────────────────────────────

export const IncidentSeverityDashboard = {

  /**
   * Builds and returns a full DashboardSnapshot for an org.
   * Runs three Supabase queries in parallel, then passes results to the
   * pure buildDashboardSnapshot function.
   *
   * @param orgId       Organisation identifier.
   * @param eventLimit  How many recent raw events to include in trend/vector analysis.
   */
  async getSnapshot(orgId: string, eventLimit = 500): Promise<DashboardSnapshot | null> {
    const startMs = Date.now()

    // Parallel fetch: incidents, raw events, alert rows
    const [incidentResult, eventsResult, alertsResult] = await Promise.allSettled([
      IncidentTimelineEngine.getIncidents(orgId, { limit: 500 }),
      supabaseServer
        .from('facttic_governance_events')
        .select('risk_score, decision, violations, timestamp')
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(eventLimit),
      supabaseServer
        .from('secops_alerts')
        .select('fired_at')
        .eq('org_id', orgId)
        .order('fired_at', { ascending: false })
        .limit(1000),
    ])

    if (incidentResult.status === 'rejected') {
      logger.error('DASHBOARD_INCIDENT_FETCH_FAILED', { orgId })
      return null
    }

    const incidents  = incidentResult.value
    const rawEvents  = eventsResult.status === 'fulfilled'
      ? (eventsResult.value.data ?? []).map((r: any) => ({
          risk_score: Number(r.risk_score) || 0,
          decision:   r.decision as string,
          violations: Array.isArray(r.violations) ? r.violations : [],
          timestamp:  Number(r.timestamp) || 0,
        }))
      : []
    const alertRows  = alertsResult.status === 'fulfilled'
      ? (alertsResult.value.data ?? [])
      : []

    const snapshot = buildDashboardSnapshot(incidents, rawEvents, alertRows, orgId, startMs)

    logger.info('DASHBOARD_SNAPSHOT_BUILT', {
      orgId,
      incidents:    incidents.length,
      raw_events:   rawEvents.length,
      build_time_ms: snapshot.build_time_ms,
    })

    return snapshot
  },

  /** Exposed for testing. */
  buildDashboardSnapshot,
}
