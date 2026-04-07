import { createHmac } from 'crypto';
import { supabaseServer } from './supabaseServer';
import { logger } from './logger';

export interface WebhookPayload {
  event: string;           // e.g. 'RISK_BLOCK', 'RISK_WARN', 'POLICY_VIOLATION'
  org_id: string;
  severity: string;
  metadata: Record<string, any>;
  triggered_at: string;
}

/**
 * WebhookDispatcher
 * Fire-and-forget delivery to customer webhook endpoints.
 * Signs each payload with HMAC-SHA256 using the endpoint's secret.
 */
export class WebhookDispatcher {

  /**
   * Dispatch an event to all active webhook endpoints for the org.
   * Never throws — failures are logged, not propagated.
   */
  static dispatch(payload: WebhookPayload): void {
    setImmediate(() => WebhookDispatcher._send(payload));
  }

  private static async _send(payload: WebhookPayload): Promise<void> {
    try {
      const { data: endpoints, error } = await supabaseServer
        .from('webhook_endpoints')
        .select('id, url, secret, events')
        .eq('org_id', payload.org_id)
        .eq('is_active', true);

      if (error || !endpoints?.length) return;

      const body = JSON.stringify(payload);
      const now = new Date().toISOString();

      await Promise.allSettled(
        endpoints
          .filter(ep => {
            // Send if endpoint subscribes to all events or specifically this one
            const evts: string[] = ep.events ?? [];
            return evts.length === 0 || evts.includes(payload.event) || evts.includes('*');
          })
          .map(ep => WebhookDispatcher._deliver(ep, body, now, payload.org_id))
      );
    } catch (err: any) {
      logger.error('WEBHOOK_DISPATCH_ERROR', { error: err.message, org_id: payload.org_id });
    }
  }

  private static async _deliver(
    ep: { id: string; url: string; secret: string },
    body: string,
    timestamp: string,
    orgId: string
  ): Promise<void> {
    const signature = createHmac('sha256', ep.secret ?? '')
      .update(`${timestamp}.${body}`)
      .digest('hex');

    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Facttic-Signature': `sha256=${signature}`,
          'X-Facttic-Timestamp': timestamp,
          'User-Agent': 'Facttic-Webhook/1.0',
        },
        body,
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      await supabaseServer
        .from('webhook_endpoints')
        .update({ last_triggered_at: timestamp })
        .eq('id', ep.id);

      logger.info('WEBHOOK_DELIVERED', { endpoint_id: ep.id, status: res.status, org_id: orgId });
    } catch (err: any) {
      logger.error('WEBHOOK_DELIVERY_FAILED', { endpoint_id: ep.id, error: err.message, org_id: orgId });
    }
  }
}
