import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { GovernanceOtelStream, GovernanceOtelEvent } from '@/lib/observability/governanceOtelStream';
import { logger } from '@/lib/logger';

/**
 * OpenTelemetry Governance Stream API
 *
 * CORE PRINCIPLE: Real-time export of governance events via SSE for external collectors.
 */
export async function GET(req: NextRequest) {
  // Use getSession() — reads JWT locally, no Supabase network round-trip
  const authClient = await createServerAuthClient();
  const { data: { session }, error: authError } = await authClient.auth.getSession();
  const user = session?.user;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
  }

  let orgId: string;
  try {
    const ctx = await resolveOrgContext(user.id);
    orgId = ctx.org_id;
  } catch {
    return new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      logger.info('OTEL_STREAM_CONNECTED', { orgId, userId: user.id });

      // SSE Header
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Function to fetch and push latest events
      const pushEvents = async () => {
        try {
          const { data: events, error: ledgerError } = await supabaseServer
            .from('facttic_governance_events')
            .select('id, session_id, org_id, event_type, prompt, decision, risk_score, violations, guardrail_signals, latency, created_at')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (ledgerError) throw ledgerError;

          if (events) {
            for (const event of events) {
              const otelEvent: GovernanceOtelEvent = {
                event_type: event.event_type || 'governance_decision',
                timestamp: event.created_at,
                org_id: event.org_id,
                risk_score: event.risk_score || 0,
                metadata: {
                  session_id: event.session_id,
                  decision: event.decision,
                  prompt: event.prompt,
                  violations: event.violations,
                  latency: event.latency,
                }
              };

              const payload = GovernanceOtelStream.formatAsOtel(otelEvent);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            }
          }
        } catch (err: any) {
          logger.error('OTEL_STREAM_POLLING_ERROR', { orgId, error: err.message });
        }
      };

      // Initial push
      await pushEvents();

      // Poll every 10 seconds for OTEL export consumers.
      // The observability dashboard uses client-side Supabase Realtime for push delivery.
      const interval = setInterval(pushEvents, 10000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        logger.info('OTEL_STREAM_DISCONNECTED', { orgId });
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
