/**
 * SecOps Alerting Engine
 *
 * Rule-based alert system that evaluates governance events and session
 * analyses against a configurable rule set, dispatches alerts through
 * configured channels, and returns structured AlertEvaluation results.
 *
 * Built-in alert rules:
 *
 *   RISK_THRESHOLD_CRITICAL   risk_score > 80 → P1 alert
 *   RISK_THRESHOLD_HIGH       risk_score > 60 → P2 alert
 *   MULTIPLE_VIOLATIONS       violations.length > 1 → P2 alert
 *   BLOCK_DECISION            decision === 'BLOCK' → P2 alert
 *   ATTACK_PATTERN_DETECTED   attack_detected === true → P2 alert
 *   ESCALATION_PATTERN        escalation_pattern === 'ESCALATING' → P3 alert
 *   JAILBREAK_CHAIN           attack_pattern === 'JAILBREAK_CHAIN' → P1 alert
 *   SLOW_ESCALATION           attack_pattern === 'SLOW_ESCALATION' → P1 alert
 *
 * Alert priority:
 *   P1  Critical — immediate response required
 *   P2  High     — response within 1 hour
 *   P3  Medium   — response within 4 hours
 *   P4  Low      — review at next scheduled interval
 *
 * Alert channels:
 *   LOG       Write structured log entry via logger
 *   DATABASE  Persist to `secops_alerts` table in Supabase
 *   WEBHOOK   POST to configured endpoint (requires ALERT_WEBHOOK_URL env var)
 */

import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'
import type { SessionAttackAnalysis } from '../forensics/sessionReconstructionEngine'
import type { GovernanceEvent } from '../evidence/evidenceLedger'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AlertPriority = 'P1' | 'P2' | 'P3' | 'P4'
export type AlertChannel  = 'LOG' | 'DATABASE' | 'WEBHOOK'
export type AlertStatus   = 'FIRED' | 'SUPPRESSED' | 'ERRORED'

export interface AlertRule {
  rule_id:     string
  name:        string
  description: string
  priority:    AlertPriority
  /** Evaluates the input context. Returns the matched reason or null. */
  evaluate(ctx: AlertContext): string | null
}

/**
 * Input context assembled by the engine before evaluating rules.
 * Combines a governance event with optional session-level analysis.
 */
export interface AlertContext {
  event:    GovernanceEvent & { id?: string }
  analysis: SessionAttackAnalysis | null
  org_id:   string
}

/** One fired alert — produced when a rule's evaluate() returns a non-null reason. */
export interface FiredAlert {
  alert_id:    string
  rule_id:     string
  rule_name:   string
  priority:    AlertPriority
  reason:      string
  session_id:  string
  org_id:      string
  risk_score:  number
  decision:    string
  channels:    AlertChannel[]
  status:      AlertStatus
  fired_at:    string
}

/** Full output of one alerting evaluation pass. */
export interface AlertEvaluation {
  evaluation_id:  string
  session_id:     string
  org_id:         string
  evaluated_at:   string
  rules_evaluated: number
  alerts_fired:   number
  /** Highest priority across all fired alerts; null if none fired. */
  highest_priority: AlertPriority | null
  alerts:         FiredAlert[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in alert rules
// ─────────────────────────────────────────────────────────────────────────────

export const BUILT_IN_RULES: AlertRule[] = [

  {
    rule_id:     'AR-001',
    name:        'RISK_THRESHOLD_CRITICAL',
    description: 'risk_score > 80. Governance pipeline detected a near-breach or confirmed attack.',
    priority:    'P1',
    evaluate(ctx) {
      return (ctx.event.risk_score ?? 0) > 80
        ? `risk_score=${ctx.event.risk_score} exceeds critical threshold (80).`
        : null
    },
  },

  {
    rule_id:     'AR-002',
    name:        'RISK_THRESHOLD_HIGH',
    description: 'risk_score > 60. Significant threat signal requiring elevated attention.',
    priority:    'P2',
    evaluate(ctx) {
      const score = ctx.event.risk_score ?? 0
      return score > 60 && score <= 80
        ? `risk_score=${score} exceeds high-risk threshold (60).`
        : null
    },
  },

  {
    rule_id:     'AR-003',
    name:        'MULTIPLE_VIOLATIONS',
    description: 'More than one governance violation recorded in a single evaluation.',
    priority:    'P2',
    evaluate(ctx) {
      const count = Array.isArray(ctx.event.violations) ? ctx.event.violations.length : 0
      return count > 1
        ? `${count} violations recorded in one evaluation: ${
            ctx.event.violations!.map((v: any) => v.rule_type).join(', ')}.`
        : null
    },
  },

  {
    rule_id:     'AR-004',
    name:        'BLOCK_DECISION',
    description: 'Governance pipeline issued a BLOCK decision.',
    priority:    'P2',
    evaluate(ctx) {
      return ctx.event.decision === 'BLOCK'
        ? `BLOCK decision issued. risk_score=${ctx.event.risk_score}.`
        : null
    },
  },

  {
    rule_id:     'AR-005',
    name:        'ATTACK_PATTERN_DETECTED',
    description: 'Session reconstruction identified a named attack pattern.',
    priority:    'P2',
    evaluate(ctx) {
      if (!ctx.analysis?.attack_detected) return null
      return `Attack pattern detected: ${ctx.analysis.attack_pattern}. ` +
        `Confidence: ${Math.round((ctx.analysis.confidence ?? 0) * 100)}%.`
    },
  },

  {
    rule_id:     'AR-006',
    name:        'ESCALATION_PATTERN',
    description: 'Session risk score is trending upward — attacker may be escalating.',
    priority:    'P3',
    evaluate(ctx) {
      // Escalation pattern is at the session level; check if provided in analysis
      // or fall back to a simple heuristic on the current event
      if (ctx.analysis) {
        return ctx.analysis.phases.length >= 2 &&
          ctx.analysis.phases[ctx.analysis.phases.length - 1].risk_score >
          ctx.analysis.phases[0].risk_score + 20
          ? `Risk score escalated from ${ctx.analysis.phases[0].risk_score} to ` +
            `${ctx.analysis.phases[ctx.analysis.phases.length - 1].risk_score} across session.`
          : null
      }
      return null
    },
  },

  {
    rule_id:     'AR-007',
    name:        'JAILBREAK_CHAIN',
    description: 'Session contains a jailbreak chain — repeated bypass attempts.',
    priority:    'P1',
    evaluate(ctx) {
      return ctx.analysis?.attack_pattern === 'JAILBREAK_CHAIN'
        ? `Jailbreak chain detected: ${ctx.analysis.phases.length} turns, ` +
          `attack vectors: [${ctx.analysis.attack_vectors.join(', ')}].`
        : null
    },
  },

  {
    rule_id:     'AR-008',
    name:        'SLOW_ESCALATION',
    description: 'Session shows BENIGN→PROBING→INJECTION→EXFILTRATION — a planned multi-step attack.',
    priority:    'P1',
    evaluate(ctx) {
      return ctx.analysis?.attack_pattern === 'SLOW_ESCALATION'
        ? `Slow escalation attack confirmed. Progression: ` +
          `${ctx.analysis.progression_vector.join(' → ')}. ` +
          `Onset at turn ${ctx.analysis.onset_turn_index}.`
        : null
    },
  },

  {
    rule_id:     'AR-009',
    name:        'MIXED_VECTOR_ATTACK',
    description: 'Session rotated across ≥ 3 attack surfaces — sophisticated multi-vector attack.',
    priority:    'P1',
    evaluate(ctx) {
      return ctx.analysis?.attack_pattern === 'MIXED_VECTOR_ATTACK' &&
        (ctx.analysis.attack_vectors.length ?? 0) >= 3
        ? `Mixed-vector attack: ${ctx.analysis.attack_vectors.join(', ')}.`
        : null
    },
  },

  {
    rule_id:     'AR-010',
    name:        'DIRECT_ATTACK_HIGH_RISK',
    description: 'Session opened with a BLOCK-triggering prompt — likely automated tooling.',
    priority:    'P1',
    evaluate(ctx) {
      return ctx.analysis?.attack_pattern === 'DIRECT_ATTACK' &&
        (ctx.event.risk_score ?? 0) >= 80
        ? `Direct attack at risk=${ctx.event.risk_score}. First turn was adversarial — possible automation.`
        : null
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Priority ordering
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<AlertPriority, number> = { P1: 4, P2: 3, P3: 2, P4: 1 }

function highestPriority(alerts: FiredAlert[]): AlertPriority | null {
  if (alerts.length === 0) return null
  return alerts.reduce(
    (best, a) => PRIORITY_RANK[a.priority] > PRIORITY_RANK[best] ? a.priority : best,
    alerts[0].priority
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert dispatch
// ─────────────────────────────────────────────────────────────────────────────

async function dispatchLog(alert: FiredAlert): Promise<void> {
  const logFn = alert.priority === 'P1' ? logger.error : logger.warn
  logFn('SECOPS_ALERT_FIRED', {
    alert_id:  alert.alert_id,
    rule:      alert.rule_name,
    priority:  alert.priority,
    session:   alert.session_id,
    risk:      alert.risk_score,
    reason:    alert.reason,
  })
}

async function dispatchDatabase(alert: FiredAlert): Promise<void> {
  const { error } = await supabaseServer
    .from('secops_alerts')
    .insert({
      alert_id:   alert.alert_id,
      rule_id:    alert.rule_id,
      rule_name:  alert.rule_name,
      priority:   alert.priority,
      reason:     alert.reason,
      session_id: alert.session_id,
      org_id:     alert.org_id,
      risk_score: alert.risk_score,
      decision:   alert.decision,
      status:     alert.status,
      fired_at:   alert.fired_at,
    })

  if (error) {
    logger.error('ALERT_DB_PERSIST_FAILED', { alert_id: alert.alert_id, error: error.message })
  }
}

async function dispatchWebhook(alert: FiredAlert): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL
  if (!url) return

  try {
    await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        source:    'facttic-secops',
        alert_id:  alert.alert_id,
        priority:  alert.priority,
        rule:      alert.rule_name,
        session_id: alert.session_id,
        org_id:    alert.org_id,
        risk_score: alert.risk_score,
        reason:    alert.reason,
        fired_at:  alert.fired_at,
      }),
    })
  } catch (err: any) {
    logger.error('ALERT_WEBHOOK_FAILED', { url, error: err.message })
  }
}

async function dispatch(alert: FiredAlert, channels: AlertChannel[]): Promise<void> {
  await Promise.allSettled([
    channels.includes('LOG')      ? dispatchLog(alert)      : Promise.resolve(),
    channels.includes('DATABASE') ? dispatchDatabase(alert)  : Promise.resolve(),
    channels.includes('WEBHOOK')  ? dispatchWebhook(alert)   : Promise.resolve(),
  ])
}

// ─────────────────────────────────────────────────────────────────────────────
// SecOpsAlertingEngine
// ─────────────────────────────────────────────────────────────────────────────

export const SecOpsAlertingEngine = {

  /**
   * Evaluates all built-in alert rules against the provided context.
   *
   * @param ctx      AlertContext containing the governance event + optional attack analysis.
   * @param channels Alert dispatch channels. Defaults to LOG + DATABASE.
   * @param rules    Alert rules to evaluate. Defaults to all BUILT_IN_RULES.
   */
  async evaluate(
    ctx:      AlertContext,
    channels: AlertChannel[] = ['LOG', 'DATABASE'],
    rules:    AlertRule[]    = BUILT_IN_RULES
  ): Promise<AlertEvaluation> {
    const evaluatedAt = new Date().toISOString()
    const fired: FiredAlert[] = []
    let alertIdx = 0

    for (const rule of rules) {
      const reason = rule.evaluate(ctx)
      if (!reason) continue

      const alert: FiredAlert = {
        alert_id:   `ALT-${ctx.event.session_id?.substring(0, 6)}-${alertIdx++}`,
        rule_id:    rule.rule_id,
        rule_name:  rule.name,
        priority:   rule.priority,
        reason,
        session_id: ctx.event.session_id,
        org_id:     ctx.org_id,
        risk_score: ctx.event.risk_score ?? 0,
        decision:   ctx.event.decision,
        channels,
        status:     'FIRED',
        fired_at:   evaluatedAt,
      }

      fired.push(alert)
      await dispatch(alert, channels)
    }

    const evaluation: AlertEvaluation = {
      evaluation_id:    `EVAL-${Date.now()}`,
      session_id:       ctx.event.session_id,
      org_id:           ctx.org_id,
      evaluated_at:     evaluatedAt,
      rules_evaluated:  rules.length,
      alerts_fired:     fired.length,
      highest_priority: highestPriority(fired),
      alerts:           fired,
    }

    if (fired.length > 0) {
      logger.info('ALERT_EVALUATION_COMPLETE', {
        session_id:       ctx.event.session_id,
        alerts_fired:     fired.length,
        highest_priority: evaluation.highest_priority,
      })
    }

    return evaluation
  },

  /**
   * Convenience method: evaluate a governance event with no session analysis.
   * Uses only event-level rules (AR-001 through AR-004).
   */
  async evaluateEvent(
    event:    GovernanceEvent & { id?: string },
    org_id:   string,
    channels: AlertChannel[] = ['LOG', 'DATABASE']
  ): Promise<AlertEvaluation> {
    return this.evaluate({ event, analysis: null, org_id }, channels)
  },

  /** The full built-in rule set — exposed for inspection and custom extension. */
  rules: BUILT_IN_RULES,
}
