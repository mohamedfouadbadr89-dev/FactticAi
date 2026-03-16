import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import voiceAnalyzerOrchestrator from "@/lib/governance/analyzers/voiceAnalyzerOrchestrator";
import { z } from 'zod';

const StreamEventSchema = z.object({
  start_ms: z.number().int().min(0),
  end_ms: z.number().int().min(0),
  speaker: z.string(),
  transcript_delta: z.string(),
  latency_ms: z.number().int().min(0).optional(),
});

const MAX_CHUNKS = 50;
const MAX_BYTES = 65536;  // 64KB
const MAX_DURATION_MS = 10000;

/**
 * In-Memory session buffer mapping to handle realtime streaming.
 * Key: session_id
 */
const sessionBuffers = new Map<string, {
  userId: string;
  orgId: string;
  voiceSessionId: string;
  chunks: any[];
  transcripts: string[];
  lastFlushMs: number;
  bytes: number;
  startTime: number;
}>();

// ── 0. Connection Limits & Tracking ──────────────────────────────────────────
// Protection against malicious socket flooding or automated connection leaks.
const MAX_ACTIVE_STREAMS = 1000;
const MAX_STREAMS_PER_ORG = 100;

const activeStreams = new Set<string>();
const orgStreamCounts = new Map<string, number>();
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // ── 1. WebSocket Upgrade Handshake ─────────────────────────────────────────
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  // ── 1.1 Global Connection Limit Check ──────────────────────────────────────
  if (activeStreams.size >= MAX_ACTIVE_STREAMS) {
    console.warn(`[Security] Global WebSocket limit reached (${MAX_ACTIVE_STREAMS}). Rejecting connection.`);
    return NextResponse.json({ error: 'Server capacity reached' }, { status: 429 });
  }

  // ── 2. Authenticate User Once on Connection ────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized WebSocket handshake' }, { status: 401 });
  }
  const user_id = session.user.id;

  // ── 3. Validate Org Membership ─────────────────────────────────────────────
  const { data: voiceSession, error: vsError } = await supabase
    .from('voice_sessions')
    .select('id, org_id:sessions(org_id)')
    .eq('session_id', sessionId)
    .single();

  if (vsError || !voiceSession || !(voiceSession.org_id as any)?.org_id) {
    return NextResponse.json({ error: 'Voice session not found or access denied' }, { status: 403 });
  }
  const orgId = (voiceSession.org_id as any).org_id;

  // ── 3.1 Per-Organization Limit Check ───────────────────────────────────────
  const currentOrgStreams = orgStreamCounts.get(orgId) || 0;
  if (currentOrgStreams >= MAX_STREAMS_PER_ORG) {
    console.warn(`[Security] Org ${orgId} reached stream limit (${MAX_STREAMS_PER_ORG}). Rejecting connection.`);
    return NextResponse.json({ error: 'Organization stream capacity reached' }, { status: 429 });
  }

  // ── 4. Store Connection Context ────────────────────────────────────────────
  sessionBuffers.set(sessionId, {
    userId: user_id,
    orgId: orgId,
    voiceSessionId: voiceSession.id,
    chunks: [],
    transcripts: [],
    lastFlushMs: 0,
    bytes: 0,
    startTime: Date.now()
  });

  // Increment counters
  activeStreams.add(sessionId);
  orgStreamCounts.set(orgId, currentOrgStreams + 1);

  return new Response(null, {
    status: 101, // Switching Protocols
    headers: {
      Upgrade: 'websocket',
      Connection: 'Upgrade',
    }
  });
}

/**
 * WebSocket Message Handler for active sessions.
 * 
 * 5. Accepts streaming payload messages.
 * 6. Buffers chunks in memory per session.
 * 7. Triggers GovernancePipeline.execute() ONLY when a semantic boundary is reached.
 */
export async function handleSocketMessage(sessionId: string, rawPayload: any) {
  const context = sessionBuffers.get(sessionId);
  if (!context) return;

  const parsed = StreamEventSchema.safeParse(rawPayload);
  if (!parsed.success) return;

  const payload = parsed.data;

  const forceFlush = async () => {
    if (context.chunks.length === 0) return;
    
    const fullTranscript = context.transcripts.join(' ');
    
    // Process physics signals across the buffered chunks
    const voiceAnalysis = await voiceAnalyzerOrchestrator(context.chunks);
    const hasIssues = voiceAnalysis.barge || voiceAnalysis.collision.hasCollision || voiceAnalysis.latency.isHighLatency;

    if (hasIssues || fullTranscript.trim().length > 0) {
      // Trigger pipeline ONCE for the aggregated semantic block
      await GovernancePipeline.execute({
        user_id: context.userId,
        org_id: context.orgId,
        session_id: sessionId,
        prompt: `[AUDIO_STREAM_BUFFER] Speaker: ${payload.speaker} | Transcript: ${fullTranscript}`,
        model: 'voice-streaming-engine-v1',
        ...(voiceAnalysis.latency.isHighLatency && { voice_latency_ms: voiceAnalysis.latency.latency_ms }),
        ...(voiceAnalysis.collision.hasCollision && { voice_collision_index: voiceAnalysis.collision.collision_index }),
        ...(voiceAnalysis.barge && { voice_barge_in_detected: true }),
      });
    }

    // Flush Buffer
    context.chunks = [];
    context.transcripts = [];
    context.lastFlushMs = payload.end_ms;
    context.bytes = 0;
    context.startTime = Date.now();
  };

  // Enforce Hard Memory Limits (OOM Protection) Before Pushing
  if (context.chunks.length >= MAX_CHUNKS) await forceFlush();
  if (context.bytes >= MAX_BYTES) await forceFlush();
  if (Date.now() - context.startTime > MAX_DURATION_MS) await forceFlush();

  // Buffer chunks
  context.chunks.push(payload);
  if (payload.transcript_delta.trim().length > 0) {
    context.transcripts.push(payload.transcript_delta);
    context.bytes += Buffer.byteLength(payload.transcript_delta, 'utf8');
  }

  // Semantic Boundary Detection: Punctuation or pause > 1.5s
  const textFragment = payload.transcript_delta;
  const isSemanticBoundary = 
    textFragment.includes('.') || 
    textFragment.includes('?') || 
    textFragment.includes('!') || 
    (payload.end_ms - context.lastFlushMs > 1500);

  if (isSemanticBoundary) {
    await forceFlush();
  }
}

/**
 * Cleanup hook to remove buffer on disconnection.
 */
export function handleSocketDisconnect(sessionId: string) {
  const context = sessionBuffers.get(sessionId);
  if (context) {
    const { orgId } = context;
    const current = orgStreamCounts.get(orgId) || 1;
    if (current <= 1) {
      orgStreamCounts.delete(orgId);
    } else {
      orgStreamCounts.set(orgId, current - 1);
    }
  }
  
  sessionBuffers.delete(sessionId);
  activeStreams.delete(sessionId);
}
