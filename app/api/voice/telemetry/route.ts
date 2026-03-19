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
  client_sent_at:        z.number().int().positive(),
  provider:              z.string().optional(),
  transcript:            z.string().optional(),
})

import { GovernancePipeline } from '@/lib/governance/governancePipeline'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/voice/telemetry')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    // Voice telemetry requires an authenticated user session.
    // user_id propagates into GovernancePipeline.execute() so every telemetry-
    // driven governance execution passes the Zero-Trust authorizeOrgAccess() gate.
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user_id = session.user.id

    const { data: orgMember, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user_id)
      .limit(1)
      .single()

    if (error || !orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = TelemetrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const payload = parsed.data;

    // Step 5 - Standardize & Execute Governance Pipeline (Fail-Closed)
    // user_id is sourced from the authenticated session — Zero-Trust gate enforced.
    // Every voice telemetry packet is now a cryptographically linked event.
    const govResult = await GovernancePipeline.execute({
      user_id,
      org_id: orgMember.org_id,
      session_id: payload.session_id,
      prompt: payload.transcript || `[Voice Telemetry Snapshot: L:${payload.latency_ms}ms P:${payload.packet_loss}%]`,
      voice_latency_ms: payload.latency_ms,
      voice_packet_loss: payload.packet_loss,
      voice_audio_integrity: payload.audio_integrity_score,
      client_sent_at: payload.client_sent_at
    });

    // Step 6 - Kill-Switch Signal Execution
    // If risk > 85, we return a hardware-level interrupt.
    if (govResult.decision === 'BLOCK' || govResult.risk_score > 85) {
      return NextResponse.json({
        status: 'BLOCK',
        action: 'INTERRUPT',
        signal: 'KILL_AUDIO_STREAM',
        reason: 'SECURITY_THRESHOLD_EXCEEDED',
        risk_score: govResult.risk_score,
        event_hash: govResult.event_hash
      });
    }

    return NextResponse.json({ 
      status: 'SUCCESS', 
      decision: govResult.decision,
      risk_score: govResult.risk_score,
      event_hash: govResult.event_hash
    })
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
