import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type GovernanceEventType =
  | 'guardrail.trigger'
  | 'incident.response'
  | 'interceptor.block'
  | 'interceptor.escalate'
  | 'interceptor.warn'
  | 'interceptor.allow'
  | 'policy.violation'
  | 'testing.run'
  | 'benchmark.computed'
  | 'deployment.config_changed'
  | 'custom'

export interface GovernanceEvent {
  org_id:     string
  event_type: GovernanceEventType
  payload:    Record<string, unknown>
  timestamp?: string
}

/** OpenTelemetry-compatible span envelope */
export interface OtelSpan {
  traceId:   string
  spanId:    string
  name:      string
  kind:      'SPAN_KIND_SERVER'
  startTime: string
  endTime:   string
  attributes: Record<string, string | number | boolean>
  status: { code: 'STATUS_CODE_OK' | 'STATUS_CODE_ERROR' }
}

export interface StreamExporter {
  name: string
  export(event: GovernanceEvent, span: OtelSpan): Promise<void>
}

// ── In-process ring buffer for dashboard metrics ──────────────────────────────

const MAX_RING = 500
const ringBuffer: Array<GovernanceEvent & { id: string }> = []

function pushRing(ev: GovernanceEvent & { id: string }) {
  ringBuffer.push(ev)
  if (ringBuffer.length > MAX_RING) ringBuffer.shift()
}

// ── OpenTelemetry formatting ──────────────────────────────────────────────────

function toHex(n: number, len: number): string {
  return n.toString(16).padStart(len, '0')
}

function buildOtelSpan(event: GovernanceEvent): OtelSpan {
  const now = event.timestamp ?? new Date().toISOString()
  const endTime = new Date(new Date(now).getTime() + 1).toISOString()

  const traceId = toHex(Date.now(), 16) + toHex(Math.floor(Math.random() * 0xffffffff), 16)
  const spanId  = toHex(Math.floor(Math.random() * 0xffffffff), 8)

  const isError = event.event_type.includes('block') || event.event_type.includes('violation')

  return {
    traceId,
    spanId,
    name:      `facttic.governance.${event.event_type}`,
    kind:      'SPAN_KIND_SERVER',
    startTime: now,
    endTime,
    attributes: {
      'facttic.org_id':     event.org_id,
      'facttic.event_type': event.event_type,
      'facttic.source':     'governance-platform',
      ...Object.fromEntries(
        Object.entries(event.payload ?? {})
          .filter(([, v]) => typeof v !== 'object')
          .slice(0, 8)
          .map(([k, v]) => [`facttic.payload.${k}`, String(v)])
      ),
    },
    status: { code: isError ? 'STATUS_CODE_ERROR' : 'STATUS_CODE_OK' },
  }
}

// ── Event Streamer ────────────────────────────────────────────────────────────

export class EventStreamer {
  private static exporters: StreamExporter[] = []

  static registerExporter(exporter: StreamExporter): void {
    this.exporters.push(exporter)
  }

  /**
   * Capture, persist, and stream a governance event.
   * Fire-and-forget — never blocks the calling pipeline.
   */
  static async emit(event: GovernanceEvent): Promise<void> {
    const now = event.timestamp ?? new Date().toISOString()
    const span = buildOtelSpan({ ...event, timestamp: now })

    // 1. Persist to DB (non-blocking)
    void supabase.from('event_streams').insert({
      org_id:     event.org_id,
      event_type: event.event_type,
      payload:    event.payload ?? {},
      created_at: now,
    }).then(({ error }) => {
      if (error) console.warn('[EventStreamer] DB persist error:', error.message)
    })

    // 2. Push to ring buffer
    pushRing({ ...event, id: span.spanId, timestamp: now })

    // 3. Fan out to exporters (parallel, errors isolated)
    await Promise.allSettled(
      this.exporters.map(exp =>
        exp.export(event, span).catch(err =>
          console.warn(`[EventStreamer] Exporter '${exp.name}' failed:`, err)
        )
      )
    )
  }

  /** Get metrics snapshot for the dashboard monitor */
  static getMetrics(windowMs = 60_000): {
    events_per_second: number
    total_in_window: number
    by_category: Record<string, number>
    recent: Array<GovernanceEvent & { id: string }>
  } {
    const cutoff = Date.now() - windowMs
    const inWindow = ringBuffer.filter(ev =>
      new Date(ev.timestamp ?? 0).getTime() > cutoff
    )

    const by_category: Record<string, number> = {}
    for (const ev of inWindow) {
      const cat = ev.event_type.split('.')[0]
      by_category[cat] = (by_category[cat] ?? 0) + 1
    }

    return {
      events_per_second: Math.round((inWindow.length / (windowMs / 1000)) * 10) / 10,
      total_in_window:   inWindow.length,
      by_category,
      recent: ringBuffer.slice(-30).reverse(),
    }
  }

  /** Load recent events from DB for the dashboard */
  static async getRecentEvents(orgId: string, limit = 50): Promise<any[]> {
    const { data } = await supabase
      .from('event_streams')
      .select('id, event_type, payload, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  }
}
