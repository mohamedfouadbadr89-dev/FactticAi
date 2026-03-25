import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'
import { z } from 'zod'
import { GovernancePipeline } from '@/lib/governance/governancePipeline'

import voiceAnalyzerOrchestrator from "@/lib/governance/analyzers/voiceAnalyzerOrchestrator"

const StreamEventSchema = z.object({
  session_id:       z.string().min(1),
  speaker:          z.string(),
  start_ms:         z.number().int().min(0),
  end_ms:           z.number().int().min(0),
  transcript_delta: z.string(),
  latency_ms:       z.number().int().min(0).optional(),
})

/**
 * GET /api/voice/stream
 * 
 * High-performance governance stream for live monitoring.
 * Delivers real-time audit signals to the dashboard or external SOC consoles.
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.user_metadata?.org_id || 'unknown';

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (data: any) => {
      try {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
      } catch (e) {}
    };

    // Heartbeat
    const keepAlive = setInterval(() => {
      writer.write(encoder.encode(': heartbeat\n\n')).catch(() => clearInterval(keepAlive));
    }, 20000);

    // Initial Status
    await sendEvent({ status: 'MONITORING_ACTIVE', org_id: orgId });

    // Stream Loop (Realtime Proxy)
    const interval = setInterval(async () => {
      try {
        const { data: latest } = await supabase
          .from('facttic_governance_events')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latest) {
          await sendEvent({
            event: 'voice-governance-event',
            speaker: latest.prompt ? 'user' : 'agent',
            text: latest.prompt || latest.model_response,
            risk_score: latest.risk_score,
            decision: latest.decision || 'ALLOW',
            latency: latest.latency || 0,
            timestamp: latest.created_at
          });
        }
      } catch (e) {}
    }, 2500);

    req.signal.onabort = () => {
      clearInterval(keepAlive);
      clearInterval(interval);
      writer.close().catch(() => {});
    };

    return new NextResponse(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Stream Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/voice/stream')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    // ── Authentication Gate ───────────────────────────────────────────────────
    // user_id is REQUIRED by GovernancePipeline.execute() to pass the
    // Zero-Trust authorizeOrgAccess() verification. Voice stream events
    // must originate from an authenticated session — no anonymous governance.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user_id = session.user.id
    // ─────────────────────────────────────────────────────────────────────────

    const body = await req.json()
    const parsed = StreamEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    
    // Step 2 — Resolve voice session
    const { data: voiceSession, error: vsError } = await supabase
      .from('voice_sessions')
      .select('id, org_id:sessions(org_id)')
      .eq('session_id', parsed.data.session_id)
      .single()
      
    if (vsError || !voiceSession) {
      return NextResponse.json({ error: 'Voice session not found' }, { status: 404 })
    }
    
    const orgId = (voiceSession.org_id as any)?.org_id || 'unknown'

    // Step 3 — Insert stream event
    const { data: insertedEvent, error: insertError } = await supabase
      .from('voice_stream_events')
      .insert({
        voice_session_id: voiceSession.id,
        speaker: parsed.data.speaker,
        start_ms: parsed.data.start_ms,
        end_ms: parsed.data.end_ms,
        transcript_delta: parsed.data.transcript_delta,
        latency_ms: parsed.data.latency_ms || 0
      })
      .select()
      .single()

    if (insertError) {
      console.warn('[Voice Stream] Failed to insert stream event:', insertError)
    }
    
    // Run the new Voice Stream Analyzers (Barge-in, Overtalk, Latency)
    // We fetch the history for the current session to compute overlap
    const { data: historyEvents } = await supabase
      .from('voice_stream_events')
      .select('speaker, start_ms, end_ms, latency_ms')
      .eq('voice_session_id', voiceSession.id)
      .order('created_at', { ascending: false })
      .limit(10)
      
    // Execute voice-specific analyzers
    const allEvents: any[] = [parsed.data, ...(historyEvents || [])];
    const voiceAnalysis = await voiceAnalyzerOrchestrator(allEvents)
    
    // Trigger Governance Pipeline if there are any collisions or if text needs checking
    // We proxy it to the main governance pipeline to guarantee it appears in forensic events.
    const hasIssues = voiceAnalysis.barge || voiceAnalysis.collision.hasCollision || voiceAnalysis.latency.isHighLatency;
    if (hasIssues || parsed.data.transcript_delta.trim().length > 0) {
      await GovernancePipeline.execute({
        user_id,                      // ✅ Authenticated user — Zero-Trust gate enforced
        org_id: orgId,
        session_id: parsed.data.session_id,
        prompt: `[AUDIO_EVENT] Speaker: ${parsed.data.speaker} | Transcript: ${parsed.data.transcript_delta}`,
        model: 'voice-streaming-engine-v1',
        // Conditional spread satisfies exactOptionalPropertyTypes — optional voice
        // params are only present in the object when they carry a defined value.
        // collision_index is the correct field name from overTalkAnalyzer (not collisionDelta).
        ...(voiceAnalysis.latency.isHighLatency  && { voice_latency_ms:        voiceAnalysis.latency.latency_ms }),
        ...(voiceAnalysis.collision.hasCollision && { voice_collision_index:   voiceAnalysis.collision.collision_index }),
        ...(voiceAnalysis.barge                  && { voice_barge_in_detected: true }),
      })
    }

    return NextResponse.json({ status: 'stream event recorded' })
  } catch (err: any) {
    console.error('[Voice Stream POST]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
