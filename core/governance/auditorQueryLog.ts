import { CURRENT_REGION } from '@/config/regions';
import { logger } from '@/lib/logger';

/**
 * Institutional Auditor Query Log (v5.3)
 * 
 * CORE PRINCIPLE: Immutable Audit Trail.
 * Records all auditor access events.
 */
export class AuditorQueryLog {
  private static logs: any[] = [];

  /**
   * Records an auditor query event.
   */
  static logQuery(scopeId: string, action: string, details?: any): void {
    const entry = {
      scopeId,
      action,
      region: CURRENT_REGION,
      timestamp: new Date().toISOString(),
      details
    };

    // Immutable push (simulated via storage later)
    this.logs.push(entry);
    
    logger.info('AUDITOR_QUERY_LOGGED', { scopeId, action });
  }

  static getLogs(): any[] {
    return this.logs;
  }
}
