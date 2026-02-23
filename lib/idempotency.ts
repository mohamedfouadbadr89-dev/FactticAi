import { createHash } from 'crypto';
import { supabaseServer } from './supabaseServer';

export interface WebhookEventRecord {
  org_id: string;
  provider: string;
  event_id: string;
  idempotency_key?: string;
  payload: any;
}

/**
 * Generates a deterministic idempotency key if one is not provided.
 * SHA256(provider + event_id + org_id)
 */
export const generateDeterministicKey = (provider: string, eventId: string, orgId: string): string => {
  return createHash('sha256')
    .update(`${provider}:${eventId}:${orgId}`)
    .digest('hex');
};

/**
 * Generates a hash of the payload for integrity tracking.
 */
export const hashPayload = (payload: any): string => {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
};

/**
 * Attempt to record a webhook event.
 * Returns { success: true } if recorded, or { success: false, duplicate: true } if duplicate.
 */
export const recordWebhookEvent = async (record: WebhookEventRecord) => {
  const idempotencyKey = record.idempotency_key || generateDeterministicKey(record.provider, record.event_id, record.org_id);
  const payloadHash = hashPayload(record.payload);

  const { error } = await supabaseServer
    .from('webhook_events')
    .insert({
      org_id: record.org_id,
      provider: record.provider,
      event_id: record.event_id,
      idempotency_key: idempotencyKey,
      payload_hash: payloadHash,
    });

  if (error) {
    // Check for unique violation (PostgreSQL code 23505)
    if (error.code === '23505') {
      return { success: false, duplicate: true, idempotency_key: idempotencyKey };
    }
    throw error;
  }

  return { success: true, idempotency_key: idempotencyKey };
};
