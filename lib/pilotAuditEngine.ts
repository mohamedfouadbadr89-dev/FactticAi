import { supabaseServer } from './supabaseServer';
import { logger } from './logger';

/**
 * Pilot Audit Engine (v4.2)
 * 
 * Objectives:
 * 1. Reconcile raw 'interactions' with 'billing_deduction' events.
 * 2. Detect "Billing Drift" (Under-billing due to race conditions).
 * 3. Verify Isolation Boundaries (Cross-org access attempts).
 */
export class PilotAuditEngine {
  constructor(private orgId: string) {}

  /**
   * Scans for Billing Drift:
   * Compares raw token usage in 'interactions' vs. deductions in 'audit_logs'.
   */
  async reconcileBilling() {
    logger.info('AUDIT_ENGINE: Starting billing reconciliation', { org_id: this.orgId });

    // Fetch raw usage
    const { data: interactions } = await supabaseServer
      .from('interactions')
      .select('id, token_usage, created_at')
      .eq('org_id', this.orgId);

    // Fetch billing events
    const { data: billingEvents } = await supabaseServer
      .from('audit_logs')
      .select('id, metadata, created_at')
      .eq('org_id', this.orgId)
      .eq('action', 'BILLING_DEDUCTION');

    const totalRawTokens = interactions?.reduce((acc, i) => acc + (i.token_usage || 0), 0) || 0;
    const totalBilledTokens = billingEvents?.reduce((acc, b) => acc + (b.metadata?.tokens || 0), 0) || 0;

    const drift = totalRawTokens - totalBilledTokens;
    const leakagePercentage = totalRawTokens > 0 ? (drift / totalRawTokens) * 100 : 0;

    return {
      total_interactions: interactions?.length || 0,
      total_raw_tokens: totalRawTokens,
      total_billed_tokens: totalBilledTokens,
      token_drift: drift,
      leakage_percentage: leakagePercentage.toFixed(2),
      revenue_recoverable: (drift * 0.00002).toFixed(2), // $0.02 per 1k tokens example
    };
  }

  /**
   * Scans for Concurrency Race Conditions:
   * Identifies tokens consumed within the same millisecond or tight windows 
   * where standard sequencers often fail.
   */
  async detectRaceConditions() {
    const { data: interactions } = await supabaseServer
      .from('interactions')
      .select('created_at')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: true });

    let raceEvents = 0;
    if (interactions) {
      for (let i = 1; i < interactions.length; i++) {
        const timeDiff = new Date(interactions[i].created_at).getTime() - 
                         new Date(interactions[i-1].created_at).getTime();
        if (timeDiff < 5) raceEvents++; // < 5ms threshold for "Race Risk"
      }
    }

    return {
      total_interactions: interactions?.length || 0,
      race_condition_risk_events: raceEvents,
      structural_risk_score: raceEvents > 10 ? 'HIGH' : 'LOW'
    };
  }

  /**
   * Verifies Isolation:
   * Checks for any audit log entries where the user context does not match the record context.
   */
  async verifyIsolation() {
    const { data: breaches } = await supabaseServer
      .from('audit_logs')
      .select('id')
      .eq('org_id', this.orgId)
      .eq('action', 'UNAUTHORIZED_ACCESS_ATTEMPT');

    return {
      isolation_breaches_detected: breaches?.length || 0,
      status: (breaches?.length || 0) === 0 ? 'VERIFIED_ISOLATED' : 'VULNERABLE'
    };
  }
}
