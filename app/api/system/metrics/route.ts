import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthContext } from "@/lib/middleware/auth"
import { supabaseServer } from "@/lib/supabaseServer"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

// ─── Thresholds ───────────────────────────────────────────────────────────────

const ERROR_RATE_WARN   = 0.10   // log warning when block rate exceeds 10 %
const LATENCY_SPIKE_MS  = 500    // log warning when avg latency exceeds 500 ms

// ─── Handler ──────────────────────────────────────────────────────────────────

export const GET = withAuth(async (
  req: NextRequest | Request,
  ctx: AuthContext
) => {
  const { orgId, requestId } = ctx
  const t0 = Date.now()

  const now          = Date.now()
  const oneMinuteAgo = new Date(now - 60_000).toISOString()
  const oneHourAgo   = new Date(now - 3_600_000).toISOString()

  // All queries run in parallel — metrics must not delay governance evaluation
  const [
    eventsMinuteRes,
    alertsHourRes,
    latencyRes,
    totalHourRes,
    blockedHourRes,
    incidentsHourRes,
  ] = await Promise.allSettled([

    // events_per_minute
    supabaseServer
      .from("facttic_governance_events")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", oneMinuteAgo),

    // alerts_per_hour
    supabaseServer
      .from("governance_alerts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", oneHourAgo),

    // avg_latency — last 100 events
    supabaseServer
      .from("facttic_governance_events")
      .select("latency, decision")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100),

    // total events last hour (denominator for error_rate)
    supabaseServer
      .from("facttic_governance_events")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", oneHourAgo),

    // BLOCK decisions last hour (numerator for error_rate)
    supabaseServer
      .from("facttic_governance_events")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("decision", "BLOCK")
      .gte("created_at", oneHourAgo),

    // incidents opened last hour
    supabaseServer
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", oneHourAgo),
  ])

  // ── Unwrap ─────────────────────────────────────────────────────────────────

  const eventsPerMinute: number | null = (() => {
    if (eventsMinuteRes.status !== "fulfilled") {
      logger.error("METRICS_EVENTS_QUERY_FAILED", {
        orgId,
        error: (eventsMinuteRes as any).reason?.message,
        requestId,
      })
      return null
    }
    const { count, error } = eventsMinuteRes.value
    if (error) {
      logger.error("METRICS_EVENTS_QUERY_FAILED", { orgId, error: error.message, requestId })
      return null
    }
    return count ?? 0
  })()

  const alertsPerHour: number | null = (() => {
    if (alertsHourRes.status !== "fulfilled") {
      logger.error("METRICS_ALERTS_QUERY_FAILED", {
        orgId,
        error: (alertsHourRes as any).reason?.message,
        requestId,
      })
      return null
    }
    const { count, error } = alertsHourRes.value
    if (error) {
      logger.error("METRICS_ALERTS_QUERY_FAILED", { orgId, error: error.message, requestId })
      return null
    }
    return count ?? 0
  })()

  const { avgLatency, p95Latency } = (() => {
    if (latencyRes.status !== "fulfilled") {
      logger.error("METRICS_LATENCY_QUERY_FAILED", {
        orgId,
        error: (latencyRes as any).reason?.message,
        requestId,
      })
      return { avgLatency: null, p95Latency: null }
    }
    const { data, error } = latencyRes.value
    if (error || !data) {
      logger.error("METRICS_LATENCY_QUERY_FAILED", { orgId, error: error?.message, requestId })
      return { avgLatency: null, p95Latency: null }
    }
    const values = (data as any[]).map(r => Number(r.latency)).filter(n => n > 0)
    if (!values.length) return { avgLatency: null, p95Latency: null }
    const sorted = [...values].sort((a, b) => a - b)
    return {
      avgLatency: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      p95Latency: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]),
    }
  })()

  const totalHour: number = (() => {
    if (totalHourRes.status !== "fulfilled") return 0
    const { count, error } = totalHourRes.value
    if (error) return 0
    return count ?? 0
  })()

  const blockedHour: number = (() => {
    if (blockedHourRes.status !== "fulfilled") return 0
    const { count, error } = blockedHourRes.value
    if (error) return 0
    return count ?? 0
  })()

  const incidentsHour: number | null = (() => {
    if (incidentsHourRes.status !== "fulfilled") {
      logger.error("METRICS_INCIDENTS_QUERY_FAILED", {
        orgId,
        error: (incidentsHourRes as any).reason?.message,
        requestId,
      })
      return null
    }
    const { count, error } = incidentsHourRes.value
    if (error) {
      logger.error("METRICS_INCIDENTS_QUERY_FAILED", { orgId, error: error.message, requestId })
      return null
    }
    return count ?? 0
  })()

  // error_rate = BLOCK decisions / total events (last hour)
  const errorRate: number | null =
    totalHour > 0 ? Math.round((blockedHour / totalHour) * 10000) / 10000 : null

  // ── Logging ────────────────────────────────────────────────────────────────

  if (avgLatency !== null && avgLatency > LATENCY_SPIKE_MS) {
    logger.warn("METRICS_LATENCY_SPIKE", {
      orgId,
      avg_ms: avgLatency,
      p95_ms: p95Latency,
      threshold_ms: LATENCY_SPIKE_MS,
      requestId,
    })
  }

  if (errorRate !== null && errorRate > ERROR_RATE_WARN) {
    logger.warn("METRICS_HIGH_ERROR_RATE", {
      orgId,
      error_rate: errorRate,
      blocked: blockedHour,
      total: totalHour,
      threshold: ERROR_RATE_WARN,
      requestId,
    })
  }

  // ── Response ───────────────────────────────────────────────────────────────

  return NextResponse.json({
    org_id:      orgId,
    computed_at: new Date().toISOString(),
    compute_ms:  Date.now() - t0,
    metrics: {
      events_per_minute: eventsPerMinute,
      alerts_per_hour:   alertsPerHour,
      incidents_per_hour: incidentsHour,
      avg_latency_ms:    avgLatency,
      p95_latency_ms:    p95Latency,
      error_rate:        errorRate,   // 0.0 – 1.0  (BLOCK decisions / total)
      total_events_1h:   totalHour,
      blocked_events_1h: blockedHour,
    },
    thresholds: {
      latency_spike_ms:  LATENCY_SPIKE_MS,
      error_rate_warn:   ERROR_RATE_WARN,
    },
  })
})
