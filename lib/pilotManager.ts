import { supabaseServer } from './supabaseServer';
import { logger } from './logger';

export interface PilotStatus {
  is_active: boolean;
  expiry_date: string;
  days_remaining: number;
}

/**
 * Enterprise Pilot Manager (v3.3)
 * 
 * Logic to manage 14-day high-touch enterprise pilots.
 */
export class PilotManager {
  private static PILOT_DURATION_DAYS = 14;

  /**
   * Activates a 14-day pilot for an organization.
   */
  static async activatePilot(orgId: string): Promise<void> {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.PILOT_DURATION_DAYS);

    const { error } = await supabaseServer
      .from('organizations')
      .update({
        metadata: {
          pilot_active: true,
          pilot_expiry: expiry.toISOString(),
          tier: 'ENTERPRISE_PILOT'
        }
      })
      .eq('id', orgId);

    if (error) {
      logger.error('Failed to activate pilot', { orgId, error: error.message });
      throw new Error('PILOT_ACTIVATION_FAILED');
    }

    logger.info('Enterprise Pilot activated', { orgId, expiry: expiry.toISOString() });
  }

  /**
   * Checks if the pilot for an organization is still valid.
   */
  static async getPilotStatus(orgId: string): Promise<PilotStatus> {
    const { data: org, error } = await supabaseServer
      .from('organizations')
      .select('metadata')
      .eq('id', orgId)
      .single();

    if (error || !org?.metadata?.pilot_active) {
      return { is_active: false, expiry_date: '', days_remaining: 0 };
    }

    const expiry = new Date(org.metadata.pilot_expiry);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      is_active: diffDays > 0,
      expiry_date: org.metadata.pilot_expiry,
      days_remaining: Math.max(0, diffDays)
    };
  }
}
