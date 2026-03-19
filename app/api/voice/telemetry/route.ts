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

    // Step 1 - Create voice session
    const { data: voiceSession, error: vsError } = await supabase
      .from('voice_sessions')
      .insert({ session_id: parsed.data.session_id, provider: parsed.data.provider || 'unknown' })
      .select()
      .single()

    if (vsError) {
      console.warn('[Voice Telemetry] Failed to create voice_session:', vsError)
    }

    if (voiceSession) {
      // Step 2 - Insert voice metrics
      await supabase
        .from('voice_metrics')
        .insert({
          voice_session_id: voiceSession.id,
          latency_ms: parsed.data.latency_ms,
          packet_loss: parsed.data.packet_loss,
          interruptions: parsed.data.interruptions,
          audio_integrity_score: parsed.data.audio_integrity_score
        })

      // Step 3 - Insert transcript if present
      if (parsed.data.transcript) {
        await supabase
          .from('voice_transcripts')
          .insert({
            voice_session_id: voiceSession.id,
            transcript: parsed.data.transcript,
            transcript_source: parsed.data.provider || 'unknown'
          })
          
        // Step 4 - Convert transcript to NormalizedMessage
        const messages = parsed.data.transcript.split('\n').map((line: string) => ({
          role: line.startsWith('Agent') ? 'assistant' : 'user',
          content: line
        }))

        // Run governance pipeline against the voice transcript + telemetry metrics.
        // user_id is sourced from the authenticated session — Zero-Trust gate enforced.
        await GovernancePipeline.execute({
          user_id,
          org_id: orgMember.org_id,
          session_id: parsed.data.session_id,
          prompt: parsed.data.transcript,
          voice_latency_ms: parsed.data.latency_ms,
          voice_packet_loss: parsed.data.packet_loss,
          voice_audio_integrity: parsed.data.audio_integrity_score
        })
      }
    }

    // Still record to old metrics store to not break old dashboard cards completely
    await VoiceTelemetryEngine.recordMetrics({
      org_id: orgMember.org_id,
      session_id: parsed.data.session_id,
      latency_ms: parsed.data.latency_ms,
      packet_loss: parsed.data.packet_loss,
      interruptions: parsed.data.interruptions,
      audio_integrity_score: parsed.data.audio_integrity_score
    })

    return NextResponse.json({ status: 'voice telemetry recorded' })
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
