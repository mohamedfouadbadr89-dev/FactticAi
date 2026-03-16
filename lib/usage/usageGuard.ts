/**
 * UsageGuard — pre-governance enforcement layer
 *
 * Runs BEFORE governance evaluation in the gateway. Two responsibilities:
 *
 *   1. Limit enforcement  — atomic DB increment via increment_org_usage().
 *                           Returns 429-ready result if daily cap exceeded.
 *
 *   2. Fraud detection    — in-memory sliding windows detect three patterns:
 *        • EVALUATION_SPIKE  — 80 % of daily limit consumed in < 1 hour
 *        • API_FLOOD         — > 50 evaluations from one org in 60 s
 *        • SESSION_ABUSE     — > 20 evaluations from one session in 60 s
 *      Detection inserts a governance_alert (fire-and-forget, never blocks).
 *
 * NOTE: The in-memory windows are accurate for single-instance deployments.
 * For multi-instance, replace with a shared cache (Redis / Upstash).
 */

import { supabaseServer } from "@/lib/supabaseServer"
import { logger }         from "@/lib/logger"

// ─── Public types ─────────────────────────────────────────────────────────────

export type UsageCode =
  | "ok"
  | "usage_limit_exceeded"

export interface UsageCheckResult {
  allowed:           boolean
  code:              UsageCode
  plan_tier:         string
  evaluations_today: number
  limit:             number
  remaining:         number
}

// ─── Fraud detection state (in-memory sliding windows) ───────────────────────
// Each entry is a sorted array of unix-ms timestamps; entries older than the
// window are pruned on every access.

const ORG_FLOOD_WINDOW_MS    = 60_000   // 60 s
const ORG_FLOOD_THRESHOLD    = 50       // evaluations / window
const SESSION_ABUSE_WINDOW_MS = 60_000  // 60 s
const SESSION_ABUSE_THRESHOLD = 20      // evaluations / window
const SPIKE_WINDOW_MS        = 3_600_000 // 1 h (time since UTC midnight)
const SPIKE_FRACTION         = 0.80     // 80 % of daily limit in < 1 h = spike

const orgFloodWindows    = new Map<string, number[]>()
const sessionAbuseWindows = new Map<string, number[]>()

function slidingCount(map: Map<string, number[]>, key: string, windowMs: number): number {
  const now   = Date.now()
  const cutoff = now - windowMs
  const times  = (map.get(key) ?? []).filter(t => t > cutoff)
  times.push(now)
  map.set(key, times)
  return times.length
}

// ─── Alert helper ─────────────────────────────────────────────────────────────

function fireFraudAlert(
  orgId:     string,
  alertType: "EVALUATION_SPIKE" | "API_FLOOD_ATTEMPT" | "SESSION_ABUSE",
  metadata:  Record<string, unknown>
): void {
  // Fire-and-forget — never awaited, never throws to caller
  supabaseServer
    .from("governance_alerts")
    .insert({
      org_id:     orgId,
      alert_type: alertType,
      severity:   "high",
      metadata,
      created_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) {
        logger.warn("USAGE_FRAUD_ALERT_FAILED", { orgId, alertType, error: error.message })
      } else {
        logger.warn("USAGE_FRAUD_ALERT_FIRED", { orgId, alertType, metadata })
      }
    })
}

// ─── UsageGuard ───────────────────────────────────────────────────────────────

export const UsageGuard = {

  /**
   * check() — call this before every governance evaluation.
   *
   * @param orgId     Organisation identifier from auth context
   * @param sessionId Session identifier (enables session-abuse detection)
   * @param tokens    Estimated token count for this request (optional)
   */
  async check(
    orgId:      string,
    sessionId?: string,
    tokens?:    number
  ): Promise<UsageCheckResult> {

    // ── Step 1: Atomic increment + limit check via DB RPC ───────────────────

    const { data, error } = await supabaseServer.rpc("increment_org_usage", {
      p_org_id: orgId,
      p_tokens: tokens ?? 0,
    })

    if (error) {
      // DB failure: fail open to avoid blocking governance on infra issues
      logger.error("USAGE_RPC_FAILED", { orgId, error: error.message })
      return {
        allowed:           true,
        code:              "ok",
        plan_tier:         "unknown",
        evaluations_today: 0,
        limit:             0,
        remaining:         0,
      }
    }

    const result = data as {
      evaluations_today: number
      token_usage:       number
      limit:             number
      plan_tier:         string
      allowed:           boolean
    }

    // ── Step 2: Enforce limit ────────────────────────────────────────────────

    if (!result.allowed) {
      logger.warn("USAGE_LIMIT_EXCEEDED", {
        orgId,
        evaluations_today: result.evaluations_today,
        limit:             result.limit,
        plan_tier:         result.plan_tier,
      })
      return {
        allowed:           false,
        code:              "usage_limit_exceeded",
        plan_tier:         result.plan_tier,
        evaluations_today: result.evaluations_today,
        limit:             result.limit,
        remaining:         0,
      }
    }

    // ── Step 3: Fraud detection (never blocks — fire-and-forget alerts) ──────

    const now        = Date.now()
    const midnightMs = new Date(new Date().toDateString()).getTime()
    const msSinceMidnight = now - midnightMs

    // Pattern 1: Evaluation spike — 80 % of limit consumed in < 1 h after reset
    if (
      msSinceMidnight < SPIKE_WINDOW_MS &&
      result.evaluations_today >= result.limit * SPIKE_FRACTION
    ) {
      fireFraudAlert(orgId, "EVALUATION_SPIKE", {
        evaluations_today: result.evaluations_today,
        limit:             result.limit,
        ms_since_midnight: msSinceMidnight,
        plan_tier:         result.plan_tier,
      })
    }

    // Pattern 2: API flood — > 50 evals from this org in last 60 s
    const orgFloodCount = slidingCount(orgFloodWindows, orgId, ORG_FLOOD_WINDOW_MS)
    if (orgFloodCount > ORG_FLOOD_THRESHOLD) {
      fireFraudAlert(orgId, "API_FLOOD_ATTEMPT", {
        evals_last_60s: orgFloodCount,
        threshold:      ORG_FLOOD_THRESHOLD,
      })
    }

    // Pattern 3: Session abuse — > 20 evals from one session in last 60 s
    if (sessionId) {
      const sessionCount = slidingCount(sessionAbuseWindows, sessionId, SESSION_ABUSE_WINDOW_MS)
      if (sessionCount > SESSION_ABUSE_THRESHOLD) {
        fireFraudAlert(orgId, "SESSION_ABUSE", {
          session_id:     sessionId,
          evals_last_60s: sessionCount,
          threshold:      SESSION_ABUSE_THRESHOLD,
        })
      }
    }

    // ── Step 4: Return success ───────────────────────────────────────────────

    return {
      allowed:           true,
      code:              "ok",
      plan_tier:         result.plan_tier,
      evaluations_today: result.evaluations_today,
      limit:             result.limit,
      remaining:         Math.max(0, result.limit - result.evaluations_today),
    }
  },
}
