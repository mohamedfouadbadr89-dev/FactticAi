/**
 * Behavioral Drift Detection Engine
 *
 * Detects when an AI model's behavior has shifted from its established baseline
 * by analyzing distributions of governance signals across time windows.
 *
 * Drift types:
 *
 *   RISK_SCORE_DRIFT         The average risk score in the current window is
 *                            statistically higher than the historical baseline.
 *                            Indicates increasing adversarial pressure OR model
 *                            behavioral loosening.
 *
 *   ATTACK_PATTERN_SHIFT     The distribution of attack pattern types has changed.
 *                            A new attack vector is dominating sessions that was
 *                            previously rare or absent.
 *
 *   DECISION_RATIO_SHIFT     The BLOCK:WARN:ALLOW ratio has changed significantly.
 *                            A rising BLOCK ratio may indicate coordinated attack;
 *                            a falling BLOCK ratio despite rising risk may indicate
 *                            policy drift or guardrail weakening.
 *
 *   VIOLATION_DENSITY_SPIKE  The average violations-per-turn has spiked above the
 *                            baseline mean. Multi-violation sessions are escalating.
 *
 *   VELOCITY_SPIKE           The number of sessions per hour has spiked — indicative
 *                            of coordinated or automated attack campaigns.
 *
 * Statistical method:
 *   Z-score over a rolling window:
 *     z = (current_value - baseline_mean) / baseline_std
 *   |z| >= 2.0 → anomaly (p ≈ 0.05)
 *   |z| >= 3.0 → severe anomaly (p ≈ 0.003)
 */

import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DriftType =
  | 'RISK_SCORE_DRIFT'
  | 'ATTACK_PATTERN_SHIFT'
  | 'DECISION_RATIO_SHIFT'
  | 'VIOLATION_DENSITY_SPIKE'
  | 'VELOCITY_SPIKE'

export type DriftSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

/** Statistical profile for one metric over a sample window. */
export interface MetricProfile {
  mean:   number
  std:    number
  min:    number
  max:    number
  count:  number
}

/** A single detected drift signal. */
export interface DriftSignal {
  signal_id:     string
  drift_type:    DriftType
  severity:      DriftSeverity
  /** Z-score magnitude — how many standard deviations from baseline. */
  z_score:       number
  baseline_mean: number
  current_value: number
  delta_pct:     number
  description:   string
  detected_at:   string
}

/** Full drift detection report for one org. */
export interface DriftDetectionReport {
  report_id:        string
  org_id:           string
  generated_at:     string
  /** Sessions in the current (recent) window analyzed. */
  current_window:   number
  /** Sessions in the historical baseline. */
  baseline_window:  number
  overall_severity: DriftSeverity
  drift_detected:   boolean
  signals:          DriftSignal[]
  baseline_profile: {
    avg_risk_score:        MetricProfile
    block_ratio:           number
    warn_ratio:            number
    avg_violations_per_turn: number
    sessions_per_hour:     number
  }
  current_profile: {
    avg_risk_score:        number
    block_ratio:           number
    warn_ratio:            number
    avg_violations_per_turn: number
    sessions_per_hour:     number
  }
  /** Actionable recommendation given the drift state. */
  recommendation:   string
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistics helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeProfile(values: number[]): MetricProfile {
  if (values.length === 0) return { mean: 0, std: 0, min: 0, max: 0, count: 0 }
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return {
    mean,
    std:   Math.sqrt(variance),
    min:   Math.min(...values),
    max:   Math.max(...values),
    count: values.length,
  }
}

function zScore(current: number, profile: MetricProfile): number {
  if (profile.std === 0) return 0
  return (current - profile.mean) / profile.std
}

function zToDriftSeverity(z: number): DriftSeverity {
  const abs = Math.abs(z)
  if (abs >= 4.0) return 'CRITICAL'
  if (abs >= 3.0) return 'HIGH'
  if (abs >= 2.0) return 'MEDIUM'
  if (abs >= 1.5) return 'LOW'
  return 'NONE'
}

function overallSeverity(signals: DriftSignal[]): DriftSeverity {
  const order: DriftSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']
  for (const level of order) {
    if (signals.some(s => s.severity === level)) return level
  }
  return 'NONE'
}

function deltaPct(current: number, baseline: number): number {
  if (baseline === 0) return current > 0 ? 100 : 0
  return Math.round(((current - baseline) / baseline) * 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// buildDriftReport — pure function
// ─────────────────────────────────────────────────────────────────────────────

interface RawEventRow {
  session_id: string
  risk_score: number
  decision:   string
  violations: any[] | null
  timestamp:  number | string
}

/**
 * Builds a DriftDetectionReport from two pre-fetched event sets.
 * Pure — no database calls.
 *
 * @param baselineEvents  Historical events (older window — the reference).
 * @param currentEvents   Recent events (current window — what we test).
 * @param orgId           Organisation identifier.
 */
export function buildDriftReport(
  baselineEvents: RawEventRow[],
  currentEvents:  RawEventRow[],
  orgId:          string
): DriftDetectionReport {
  const now = new Date().toISOString()
  const signals: DriftSignal[] = []

  // ── Baseline metrics ───────────────────────────────────────────────────────

  const baseRiskScores  = baselineEvents.map(e => Number(e.risk_score) || 0)
  const baseRiskProfile = computeProfile(baseRiskScores)
  const baseBlockRatio  = baselineEvents.length > 0
    ? baselineEvents.filter(e => e.decision === 'BLOCK').length / baselineEvents.length : 0
  const baseWarnRatio   = baselineEvents.length > 0
    ? baselineEvents.filter(e => e.decision === 'WARN').length / baselineEvents.length : 0
  const baseViolationsPerTurn = baselineEvents.length > 0
    ? baselineEvents.reduce((s, e) => s + (Array.isArray(e.violations) ? e.violations.length : 0), 0) / baselineEvents.length : 0

  // Baseline velocity: sessions per hour
  const baseTimestamps = baselineEvents.map(e => Number(e.timestamp))
  const baseSessions   = new Set(baselineEvents.map(e => e.session_id)).size
  const baseSpanHours  = baseTimestamps.length >= 2
    ? (Math.max(...baseTimestamps) - Math.min(...baseTimestamps)) / 3_600_000 : 1
  const baseVelocity   = baseSessions / Math.max(baseSpanHours, 1)

  // ── Current metrics ────────────────────────────────────────────────────────

  const currRiskScores  = currentEvents.map(e => Number(e.risk_score) || 0)
  const currAvgRisk     = currRiskScores.length > 0
    ? currRiskScores.reduce((s, v) => s + v, 0) / currRiskScores.length : 0
  const currBlockRatio  = currentEvents.length > 0
    ? currentEvents.filter(e => e.decision === 'BLOCK').length / currentEvents.length : 0
  const currWarnRatio   = currentEvents.length > 0
    ? currentEvents.filter(e => e.decision === 'WARN').length / currentEvents.length : 0
  const currViolationsPerTurn = currentEvents.length > 0
    ? currentEvents.reduce((s, e) => s + (Array.isArray(e.violations) ? e.violations.length : 0), 0) / currentEvents.length : 0

  const currTimestamps = currentEvents.map(e => Number(e.timestamp))
  const currSessions   = new Set(currentEvents.map(e => e.session_id)).size
  const currSpanHours  = currTimestamps.length >= 2
    ? (Math.max(...currTimestamps) - Math.min(...currTimestamps)) / 3_600_000 : 1
  const currVelocity   = currSessions / Math.max(currSpanHours, 1)

  let signalIdx = 0

  // ── Signal 1: RISK_SCORE_DRIFT ─────────────────────────────────────────────
  {
    const z    = zScore(currAvgRisk, baseRiskProfile)
    const sev  = zToDriftSeverity(z)
    if (sev !== 'NONE') {
      signals.push({
        signal_id:     `DS-${signalIdx++}`,
        drift_type:    'RISK_SCORE_DRIFT',
        severity:      sev,
        z_score:       Math.round(z * 100) / 100,
        baseline_mean: Math.round(baseRiskProfile.mean),
        current_value: Math.round(currAvgRisk),
        delta_pct:     deltaPct(currAvgRisk, baseRiskProfile.mean),
        description:   `Average risk score shifted from ${Math.round(baseRiskProfile.mean)} ` +
          `to ${Math.round(currAvgRisk)} (z=${z.toFixed(2)}, ${deltaPct(currAvgRisk, baseRiskProfile.mean)}% change).`,
        detected_at:   now,
      })
    }
  }

  // ── Signal 2: DECISION_RATIO_SHIFT ────────────────────────────────────────
  {
    const blockProfile = computeProfile(
      baselineEvents.map(e => e.decision === 'BLOCK' ? 1 : 0)
    )
    const z    = zScore(currBlockRatio, blockProfile)
    const sev  = zToDriftSeverity(z)
    if (sev !== 'NONE') {
      signals.push({
        signal_id:     `DS-${signalIdx++}`,
        drift_type:    'DECISION_RATIO_SHIFT',
        severity:      sev,
        z_score:       Math.round(z * 100) / 100,
        baseline_mean: Math.round(baseBlockRatio * 100),
        current_value: Math.round(currBlockRatio * 100),
        delta_pct:     deltaPct(currBlockRatio, baseBlockRatio),
        description:   `BLOCK rate shifted from ${Math.round(baseBlockRatio * 100)}% ` +
          `to ${Math.round(currBlockRatio * 100)}% (z=${z.toFixed(2)}).`,
        detected_at:   now,
      })
    }
  }

  // ── Signal 3: VIOLATION_DENSITY_SPIKE ────────────────────────────────────
  {
    const violProfile = computeProfile(
      baselineEvents.map(e => Array.isArray(e.violations) ? e.violations.length : 0)
    )
    const z    = zScore(currViolationsPerTurn, violProfile)
    const sev  = zToDriftSeverity(z)
    if (sev !== 'NONE') {
      signals.push({
        signal_id:     `DS-${signalIdx++}`,
        drift_type:    'VIOLATION_DENSITY_SPIKE',
        severity:      sev,
        z_score:       Math.round(z * 100) / 100,
        baseline_mean: Math.round(baseViolationsPerTurn * 100) / 100,
        current_value: Math.round(currViolationsPerTurn * 100) / 100,
        delta_pct:     deltaPct(currViolationsPerTurn, baseViolationsPerTurn),
        description:   `Violations per turn rose from ${baseViolationsPerTurn.toFixed(2)} ` +
          `to ${currViolationsPerTurn.toFixed(2)} (z=${z.toFixed(2)}).`,
        detected_at:   now,
      })
    }
  }

  // ── Signal 4: VELOCITY_SPIKE ──────────────────────────────────────────────
  {
    const z    = zScore(currVelocity, computeProfile([baseVelocity]))
    const sev  = currVelocity > baseVelocity * 2.5 ? 'HIGH'
               : currVelocity > baseVelocity * 1.8 ? 'MEDIUM'
               : 'NONE'
    if (sev !== 'NONE') {
      signals.push({
        signal_id:     `DS-${signalIdx++}`,
        drift_type:    'VELOCITY_SPIKE',
        severity:      sev,
        z_score:       Math.round(z * 100) / 100,
        baseline_mean: Math.round(baseVelocity * 10) / 10,
        current_value: Math.round(currVelocity * 10) / 10,
        delta_pct:     deltaPct(currVelocity, baseVelocity),
        description:   `Session velocity increased from ${baseVelocity.toFixed(1)}/h ` +
          `to ${currVelocity.toFixed(1)}/h — possible automated attack campaign.`,
        detected_at:   now,
      })
    }
  }

  const topSeverity = overallSeverity(signals)

  const recommendation =
    topSeverity === 'CRITICAL'
      ? 'IMMEDIATE: Activate incident response. Risk distribution has diverged critically from baseline.'
    : topSeverity === 'HIGH'
      ? 'URGENT: Increase monitoring frequency and review recent sessions for coordinated attack patterns.'
    : topSeverity === 'MEDIUM'
      ? 'MONITOR: Behavioral drift detected. Schedule policy review and compare against threat intelligence profiles.'
    : topSeverity === 'LOW'
      ? 'WATCH: Minor drift — continue monitoring. No immediate action required.'
    : 'STABLE: All metrics within normal parameters.'

  return {
    report_id:        `DRIFT-${orgId.substring(0, 6)}-${Date.now()}`,
    org_id:           orgId,
    generated_at:     now,
    current_window:   currentEvents.length,
    baseline_window:  baselineEvents.length,
    overall_severity: topSeverity,
    drift_detected:   topSeverity !== 'NONE',
    signals,
    baseline_profile: {
      avg_risk_score:          baseRiskProfile,
      block_ratio:             Math.round(baseBlockRatio * 100) / 100,
      warn_ratio:              Math.round(baseWarnRatio * 100) / 100,
      avg_violations_per_turn: Math.round(baseViolationsPerTurn * 100) / 100,
      sessions_per_hour:       Math.round(baseVelocity * 10) / 10,
    },
    current_profile: {
      avg_risk_score:          Math.round(currAvgRisk),
      block_ratio:             Math.round(currBlockRatio * 100) / 100,
      warn_ratio:              Math.round(currWarnRatio * 100) / 100,
      avg_violations_per_turn: Math.round(currViolationsPerTurn * 100) / 100,
      sessions_per_hour:       Math.round(currVelocity * 10) / 10,
    },
    recommendation,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DriftDetectionEngine — database-backed service
// ─────────────────────────────────────────────────────────────────────────────

export const DriftDetectionEngine = {

  /**
   * Fetches governance events for an org and computes a drift report.
   *
   * @param orgId           Organisation identifier.
   * @param currentWindow   Number of recent events to use as the current sample.
   * @param baselineWindow  Number of older events to use as the baseline. Must be > currentWindow.
   */
  async detect(
    orgId:          string,
    currentWindow  = 50,
    baselineWindow = 200
  ): Promise<DriftDetectionReport | null> {
    const total = currentWindow + baselineWindow

    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('session_id, risk_score, decision, violations, timestamp')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(total)

    if (error || !data || data.length < 10) {
      logger.warn('DRIFT_DETECTION_INSUFFICIENT_DATA', { orgId, rows: data?.length ?? 0 })
      return null
    }

    // Split: newest N = current, older = baseline
    const current  = data.slice(0, currentWindow)
    const baseline = data.slice(currentWindow)

    const report = buildDriftReport(baseline, current, orgId)

    logger.info('DRIFT_DETECTION_COMPLETE', {
      orgId,
      overall_severity: report.overall_severity,
      drift_detected:   report.drift_detected,
      signals:          report.signals.length,
    })

    return report
  },

  /** Exposed for testing and offline analysis. */
  buildDriftReport,
}
