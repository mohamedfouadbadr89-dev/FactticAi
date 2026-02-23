import { supabaseServer } from './supabaseServer';

export type BillingEventType = 'chat_session' | 'voice_minute' | 'manual_eval' | 'sandbox_use';

export interface BillingEventResult {
  success: boolean;
  eu_consumed: number;
  remaining_quota: number;
}

/**
 * Deterministic Billing Resolver
 * 
 * Invokes the record_billing_event RPC to securely log and calculate consumption.
 * This is the ONLY bridge between the API and the Billing Engine.
 */
export const recordBillingEvent = async (
  orgId: string, 
  type: BillingEventType, 
  units: number, 
  metadata: any = {}
): Promise<BillingEventResult> => {
  const { data, error } = await supabaseServer.rpc('record_billing_event', {
    p_org_id: orgId,
    p_type: type,
    p_units: units,
    p_metadata: metadata
  });

  if (error) {
    // Check specifically for the 402 exception string from RPC
    if (error.message.includes('402')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw new Error(error.message || 'Failed to record billing event');
  }

  return data as BillingEventResult;
};
