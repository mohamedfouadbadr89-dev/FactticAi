import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VoiceTelemetryEngine } from '@/lib/voice/telemetryEngine'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'
import { z } from 'zod'

const TelemetrySchema = z.object({
  session_id:            z.string().min(1),
  latency_ms:            z.number().min(0),
  packet_loss:           z.number().min(0).max(100),
  interruptions:         z.number().int().min(0),
  audio_integrity_score: z.number().min(0).max(100),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/voice/telemetry')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: orgMember, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (error || !orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = TelemetrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const report = await VoiceTelemetryEngine.recordMetrics({
      org_id: orgMember.org_id,
      ...parsed.data,
    })

    return NextResponse.json({ success: true, report })
  } catch (err: any) {
    console.error('[Voice Telemetry POST]', err)
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

    const url = new URL(req.url)
    if (url.searchParams.get('seed') === 'true') {
      await VoiceTelemetryEngine.seedDemoData(orgMember.org_id)
    }

    const summaries = await VoiceTelemetryEngine.getOrgSummary(orgMember.org_id)
    return NextResponse.json({ summaries })
  } catch (err: any) {
    console.error('[Voice Telemetry GET]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
