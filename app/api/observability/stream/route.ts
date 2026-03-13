import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { EventStreamer, type GovernanceEventType } from '@/lib/observability/eventStreamer'
import { initExporters } from '@/lib/observability/exporters'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'
import { z } from 'zod'

// Activate exporters on first import
initExporters()

const StreamSchema = z.object({
  event_type: z.enum([
    'guardrail.trigger',
    'incident.response',
    'interceptor.block',
    'interceptor.escalate',
    'interceptor.warn',
    'interceptor.allow',
    'policy.violation',
    'testing.run',
    'benchmark.computed',
    'deployment.config_changed',
    'custom',
  ]),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/governance/stream')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: orgMember, error: rbacErr } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacErr || !orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = StreamSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    await EventStreamer.emit({
      org_id:     orgMember.org_id,
      event_type: parsed.data.event_type as GovernanceEventType,
      payload:    parsed.data.payload,
    })

    return NextResponse.json({ success: true, event_type: parsed.data.event_type })
  } catch (err: any) {
    console.error('[Stream API]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (!orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const metrics  = EventStreamer.getMetrics()
    const recent   = await EventStreamer.getRecentEvents(orgMember.org_id)
    const exporters = [
      { name: 'Datadog',    active: !!process.env.DD_API_KEY,                        color: '#ef4444' },
      { name: 'Grafana',    active: !!process.env.GRAFANA_LOKI_URL,                  color: '#f97316' },
      { name: 'Prometheus', active: !!process.env.PROMETHEUS_PUSHGATEWAY_URL,        color: '#3b82f6' },
    ]

    return NextResponse.json({ metrics, recent, exporters })
  } catch (err: any) {
    console.error('[Stream Monitor API]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
