import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthContext } from "@/lib/middleware/auth"
import { supabaseServer } from "@/lib/supabaseServer"
import { logger } from "@/lib/logger"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  event_id:      string
  session_id:    string
  prompt:        string | null
  model:         string
  decision:      string
  risk_score:    number
  violations:    any[]
  timestamp:     string       // ISO-8601 derived from timestamp_ms
  timestamp_ms:  number
  event_hash:    string | null
  previous_hash: string | null
  latency:       number
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const GET = withAuth(async (
  req: NextRequest | Request,
  ctx: AuthContext
) => {
  const { orgId } = ctx
  const requestId = crypto.randomUUID()

  // ── Step 1: Extract and validate session_id ──────────────────────────────

  const url = new URL(req.url)
  const sessionId = url.searchParams.get("session_id")?.trim()

  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id query parameter is required" },
      { status: 400 }
    )
  }

  // ── Step 2: Query canonical ledger ───────────────────────────────────────
  // Org isolation enforced via .eq("org_id", orgId) — a session from another
  // org returns an empty array, not a 403, to avoid session enumeration.

  const { data, error } = await supabaseServer
    .from("facttic_governance_events")
    .select(
      "id, session_id, org_id, prompt, model, decision, risk_score, violations, " +
      "event_hash, previous_hash, latency, timestamp, created_at"
    )
    .eq("session_id", sessionId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })

  if (error) {
    logger.error("TIMELINE_QUERY_FAILED", { sessionId, orgId, error: error.message, requestId })
    return NextResponse.json(
      { error: "Failed to retrieve timeline" },
      { status: 500 }
    )
  }

  // ── Step 3: Map to timeline shape ─────────────────────────────────────────

  const timeline: TimelineEvent[] = (data ?? []).map((row: any) => {
    const ts = Number(row.timestamp)  // stored as BIGINT unix-ms
    return {
      event_id:      row.id,
      session_id:    row.session_id,
      prompt:        row.prompt ?? null,
      model:         row.model ?? "unspecified",
      decision:      row.decision,
      risk_score:    row.risk_score ?? 0,
      violations:    Array.isArray(row.violations) ? row.violations : [],
      timestamp:     ts > 0 ? new Date(ts).toISOString() : row.created_at,
      timestamp_ms:  ts,
      event_hash:    row.event_hash ?? null,
      previous_hash: row.previous_hash ?? null,
      latency:       row.latency ?? 0,
    }
  })

  // ── Step 4: Mirror to forensic index (fire-and-forget) ───────────────────
  // Non-blocking — a mirror failure must never degrade the timeline response.

  if (timeline.length > 0) {
    const forensicRows = timeline.map(e => ({
      source_event_id: e.event_id,
      session_id:      e.session_id,
      org_id:          orgId,
      event_type:      "governance_decision",
      prompt:          e.prompt,
      model:           e.model,
      decision:        e.decision,
      risk_score:      e.risk_score,
      violations:      e.violations,
      event_hash:      e.event_hash,
      previous_hash:   e.previous_hash,
      latency:         e.latency,
      timestamp_ms:    e.timestamp_ms,
      created_at:      e.timestamp,
    }))

    supabaseServer
      .from("forensic_events")
      .upsert(forensicRows, { onConflict: "source_event_id", ignoreDuplicates: true })
      .then(({ error: mirrorErr }) => {
        if (mirrorErr) {
          logger.warn("FORENSIC_MIRROR_FAILED", {
            sessionId,
            orgId,
            error: mirrorErr.message,
            requestId,
          })
        }
      })
  }

  // ── Step 5: Return structured response ───────────────────────────────────

  logger.info("TIMELINE_SERVED", {
    orgId,
    sessionId,
    event_count: timeline.length,
    requestId,
  })

  return NextResponse.json({
    session_id:  sessionId,
    event_count: timeline.length,
    timeline,
  })
})
