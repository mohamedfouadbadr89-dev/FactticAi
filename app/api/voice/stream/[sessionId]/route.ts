import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/voice/stream/[sessionId]
 *
 * Server-Sent Events (SSE) endpoint for live transcript streaming.
 * Polls session_turns every 1.5s and pushes new turns to the client.
 *
 * Usage (client-side):
 *   const es = new EventSource(`/api/voice/stream/${sessionId}`)
 *   es.onmessage = (e) => {
 *     const turn = JSON.parse(e.data)  // { id, role, content, risk_score, timestamp }
 *   }
 *   es.addEventListener('done', () => es.close())
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Auth check
  const authClient = await createServerAuthClient();
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify session belongs to user's org
  const { data: orgMember } = await supabaseServer
    .from('org_members')
    .select('org_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!orgMember?.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = orgMember.org_id;

  // Verify session exists and belongs to org
  const { data: sessionRow } = await supabaseServer
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (!sessionRow) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // SSE stream
  const encoder = new TextEncoder();
  let closed = false;
  let lastTurnTimestamp: string | null = null;
  let pollCount = 0;
  const MAX_POLLS = 120; // 3 minutes max (120 × 1.5s)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Send initial turns already in DB
      const { data: existingTurns } = await supabaseServer
        .from('session_turns')
        .select('id, role, content, incremental_risk, created_at')
        .eq('session_id', sessionId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: true });

      for (const turn of existingTurns ?? []) {
        send('message', {
          id: turn.id,
          role: turn.role,
          content: turn.content,
          risk_score: turn.incremental_risk ?? 0,
          timestamp: turn.created_at,
        });
        lastTurnTimestamp = turn.created_at;
      }

      // Poll for new turns
      const poll = async () => {
        if (closed || pollCount >= MAX_POLLS) {
          send('done', { reason: pollCount >= MAX_POLLS ? 'timeout' : 'closed' });
          controller.close();
          return;
        }

        pollCount++;

        // Check if session ended
        const { data: sess } = await supabaseServer
          .from('sessions')
          .select('status')
          .eq('id', sessionId)
          .maybeSingle();

        // Fetch new turns since last seen
        let query = supabaseServer
          .from('session_turns')
          .select('id, role, content, incremental_risk, created_at')
          .eq('session_id', sessionId)
          .eq('org_id', orgId)
          .order('created_at', { ascending: true });

        if (lastTurnTimestamp) {
          query = query.gt('created_at', lastTurnTimestamp);
        }

        const { data: newTurns } = await query;

        for (const turn of newTurns ?? []) {
          send('message', {
            id: turn.id,
            role: turn.role,
            content: turn.content,
            risk_score: turn.incremental_risk ?? 0,
            timestamp: turn.created_at,
          });
          lastTurnTimestamp = turn.created_at;
        }

        // Session finished — send done and close
        if (sess?.status === 'ended' || sess?.status === 'completed') {
          send('done', { reason: 'session_ended' });
          controller.close();
          closed = true;
          return;
        }

        // Schedule next poll
        setTimeout(poll, 1500);
      };

      setTimeout(poll, 1500);
    },

    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
