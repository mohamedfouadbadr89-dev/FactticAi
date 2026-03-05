import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { createHash } from 'crypto';

/**
 * Session Integrity Engine
 * 
 * Provides deterministic hashing and verification of session timelines
 * to detect data manipulation or unauthorized log edits.
 */
export class SessionIntegrity {
  
  /**
   * Generates a SHA256 checksum for a session timeline payload.
   */
  static generateChecksum(payload: any): string {
    const data = JSON.stringify(payload);
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Stores a new checksum for a session.
   */
  static async storeChecksum(sessionId: string, checksum: string): Promise<boolean> {
    try {
      const { error } = await supabaseServer
        .from('conversation_checksums')
        .upsert({ session_id: sessionId, checksum }, { onConflict: 'session_id' });

      if (error) {
        logger.error('STORE_CHECKSUM_FAILED', { sessionId, error: error.message });
        return false;
      }

      return true;
    } catch (err: any) {
      logger.error('STORE_CHECKSUM_EXCEPTION', { sessionId, error: err.message });
      return false;
    }
  }

  /**
   * Verifies the integrity of a session by comparing current payload against stored checksum.
   */
  static async verifyIntegrity(sessionId: string, currentPayload: any): Promise<{ intact: boolean; stored: string | null; calculated: string }> {
    const calculated = this.generateChecksum(currentPayload);
    
    try {
      const { data, error } = await supabaseServer
        .from('conversation_checksums')
        .select('checksum')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        logger.warn('CHECKSUM_MISSING', { sessionId });
        return { intact: false, stored: null, calculated };
      }

      const intact = data.checksum === calculated;
      
      if (!intact) {
        logger.error('SESSION_TAMPER_DETECTED', { sessionId, stored: data.checksum, calculated });
      }

      return { intact, stored: data.checksum, calculated };
      
    } catch (err: any) {
      logger.error('VERIFY_INTEGRITY_EXCEPTION', { sessionId, error: err.message });
      return { intact: false, stored: null, calculated };
    }
  }
}
