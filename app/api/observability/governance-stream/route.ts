import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { GovernanceOtelStream, GovernanceOtelEvent } from '@/lib/observability/governanceOtelStream';
import { logger } from '@/lib/logger';

/**
 * OpenTelemetry Governance Stream API
 * 
 * CORE PRINCIPLE: Real-time export of governance events via SSE for external collectors.
 */
export async function GET(req: NextRequest) {
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
  }

  // Fetch org_id
  const { data: orgMember } = await supabaseServer
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!orgMember) {
    return new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 });
  }

  const orgId = orgMember.org_id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      logger.info('OTEL_STREAM_CONNECTED', { orgId, userId: user.id });

      // SSE Header
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Function to fetch and push latest events
      const pushEvents = async () => {
        try {
          // Pull recent events from ledger (last 30 seconds for initial burst, then polling or realtime)
          const { data: events, error: ledgerError } = await supabaseServer
            .from('governance_event_ledger')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (ledgerError) throw ledgerError;

          if (events) {
            for (const event of events) {
              const otelEvent: GovernanceOtelEvent = {
                event_type: event.event_type,
                timestamp: event.created_at,
                org_id: event.org_id,
                risk_score: (event.event_payload as any).risk_score || 0,
                metadata: event.event_payload as Record<string, any>
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

      // Poll every 10 seconds (In a real system, use Supabase Realtime)
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
