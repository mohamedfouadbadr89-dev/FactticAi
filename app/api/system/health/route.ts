import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthContext } from "@/lib/middleware/auth"
import { supabaseServer } from "@/lib/supabaseServer"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

// ─── Thresholds ───────────────────────────────────────────────────────────────

const LATENCY_SPIKE_MS  = 500   // warn when avg governance latency exceeds this
const DEGRADED_RATE     = 0.10  // warn when error rate exceeds 10 %

// ─── Handler ──────────────────────────────────────────────────────────────────

export const GET = withAuth(async (
  req: NextRequest | Request,
  ctx: AuthContext
) => {
  const { orgId } = ctx
  const requestId = crypto.randomUUID()
  const t0 = Date.now()

  // All checks run in parallel — health must never slow governance evaluation
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()

  const [dbCheck, latencyCheck, eventsCheck, alertsCheck] = await Promise.allSettled([

    // ── 1. DB connectivity ─────────────────────────────────────────────────
    // Lightest possible query — single row, no full-scan
    (async () => {
      const probe = Date.now()
      const { error } = await supabaseServer
        .from("facttic_governance_events")
        .select("id")
        .limit(1)
      return { connected: !error, latency_ms: Date.now() - probe, error: error?.message ?? null }
    })(),

    // ── 2. Governance engine latency (sampled from recent events) ──────────
    // Reads last 50 latency values — no pipeline execution, no side effects
    (async () => {
      const { data, error } = await supabaseServer
        .from("facttic_governance_events")
        .select("latency")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      const values = (data ?? []).map((r: any) => Number(r.latency)).filter(n => n > 0)
      const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
      const p95 = values.length
        ? Math.round(values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)] ?? avg!)
        : null
      return { avg_ms: avg, p95_ms: p95, sample_size: values.length }
    })(),

    // ── 3. Event ingestion rate (last 60 s) ───────────────────────────────
    (async () => {
      const { count, error } = await supabaseServer
        .from("facttic_governance_events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", oneMinuteAgo)
      if (error) throw error
      return { events_last_60s: count ?? 0 }
    })(),

    // ── 4. Alert generation rate (last 60 s) ──────────────────────────────
    (async () => {
      const { count, error } = await supabaseServer
        .from("governance_alerts")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", oneMinuteAgo)
      if (error) throw error
      return { alerts_last_60s: count ?? 0 }
    })(),
  ])

  // ── Unwrap results ─────────────────────────────────────────────────────────

  const db = dbCheck.status === "fulfilled"
    ? dbCheck.value
    : (() => {
        logger.error("HEALTH_DB_FAILED", { orgId, error: (dbCheck as any).reason?.message, requestId })
        return { connected: false, latency_ms: null, error: "DB check failed" }
      })()

  const latency = latencyCheck.status === "fulfilled"
    ? latencyCheck.value
    : (() => {
        logger.error("HEALTH_LATENCY_CHECK_FAILED", { orgId, error: (latencyCheck as any).reason?.message, requestId })
        return { avg_ms: null, p95_ms: null, sample_size: 0 }
      })()

  const events = eventsCheck.status === "fulfilled"
    ? eventsCheck.value
    : { events_last_60s: null }

  const alerts = alertsCheck.status === "fulfilled"
    ? alertsCheck.value
    : { alerts_last_60s: null }

  // ── Logging ────────────────────────────────────────────────────────────────

  if (latency.avg_ms !== null && latency.avg_ms > LATENCY_SPIKE_MS) {
    logger.warn("HEALTH_LATENCY_SPIKE", {
      orgId,
      avg_ms: latency.avg_ms,
      p95_ms: latency.p95_ms,
      threshold_ms: LATENCY_SPIKE_MS,
      requestId,
    })
  }

  // ── Status classification ──────────────────────────────────────────────────

  const status: "healthy" | "degraded" | "down" =
    !db.connected                          ? "down"
    : latency.avg_ms !== null &&
      latency.avg_ms > LATENCY_SPIKE_MS * 2 ? "degraded"
    : "healthy"

  // ── Response ───────────────────────────────────────────────────────────────

  return NextResponse.json({
    status,
    checked_at:    new Date().toISOString(),
    check_ms:      Date.now() - t0,
    database: {
      connected:  db.connected,
      latency_ms: db.latency_ms,
      error:      db.error,
    },
    governance: {
      avg_latency_ms: latency.avg_ms,
      p95_latency_ms: latency.p95_ms,
      sample_size:    latency.sample_size,
    },
    ingestion: {
      events_last_60s: events.events_last_60s,
    },
    alerts: {
      alerts_last_60s: alerts.alerts_last_60s,
    },
  }, { status: status === "down" ? 503 : 200 })
})
