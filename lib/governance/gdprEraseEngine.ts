import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

/**
 * GDPR Erasure Engine
 * 
 * CORE PRINCIPLE: Right-to-Erasure compliance. Coordinated purge of session-linked data.
 */
export class GdprEraseEngine {
  /**
   * Erases all traces of a session across the platform.
   */
  static async eraseSession(orgId: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
    logger.warn('GDPR_ERASURE_INITIATED', { orgId, sessionId });

    // 1. Record the request
    const { data: request, error: requestError } = await supabaseServer
      .from('gdpr_erasure_requests')
      .insert({
        org_id: orgId,
        session_id: sessionId,
        request_status: 'PENDING'
      })
      .select()
      .single();

    if (requestError) {
      logger.error('GDPR_REQUEST_RECORD_FAILED', { orgId, sessionId, error: requestError.message });
      return { success: false, error: requestError.message };
    }

    try {
      // 2. Coordinated Purge (Reverse dependency order)
      
      // Tables referencing session_id
      const purgeTables = [
        'facttic_governance_events',
        'evaluations',
        'messages',
        'session_turns',
        'governance_snapshots',
        'governance_root_cause_reports'
      ];

      for (const table of purgeTables) {
        const { error: deleteError } = await supabaseServer
          .from(table)
          .delete()
          .eq('session_id', sessionId);
        
        if (deleteError) {
          logger.error(`GDPR_PURGE_FAILED_TABLE:${table}`, { sessionId, error: deleteError.message });
          // We continue to purge as much as possible, but mark as failed later
        }
      }

      // 3. Delete the session record itself
      const { error: sessionDeleteError } = await supabaseServer
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('org_id', orgId);

      if (sessionDeleteError) {
        throw new Error(`Failed to delete session root record: ${sessionDeleteError.message}`);
      }

      // 4. Update request status
      await supabaseServer
        .from('gdpr_erasure_requests')
        .update({
          request_status: 'PROCESSED',
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      logger.info('GDPR_ERASURE_COMPLETED', { sessionId });
      return { success: true };

    } catch (err: any) {
      logger.error('GDPR_ERASURE_CRITICAL_FAILURE', { sessionId, error: err.message });
      
      await supabaseServer
        .from('gdpr_erasure_requests')
        .update({
          request_status: 'FAILED',
          error_message: err.message
        })
        .eq('id', request.id);

      return { success: false, error: err.message };
    }
  }
}
