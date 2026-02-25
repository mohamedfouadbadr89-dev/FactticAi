import crypto from 'node:crypto';
import { logger } from '@/lib/logger';

/**
 * Institutional Audit Window Manager (v5.1)
 * 
 * CORE PRINCIPLE: Evidence Immobility.
 * Freezes and hashes governance evidence for a specific audit window.
 */

export interface AuditWindow {
  id: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED';
  windowHash: string;
}

export class AuditWindowManager {
  private static activeWindow: AuditWindow | null = null;

  /**
   * Opens a new audit window.
   */
  static openWindow(id: string, startDate: string, endDate: string): AuditWindow {
    this.activeWindow = {
      id,
      startDate,
      endDate,
      status: 'OPEN',
      windowHash: 'PENDING'
    };
    logger.info('AUDIT_WINDOW_OPENED', { id });
    return this.activeWindow;
  }

  /**
   * Locks the active window and generates a non-repudiable hash.
   */
  static lockWindow(evidencePayload: unknown): AuditWindow {
    if (!this.activeWindow) throw new Error('NO_ACTIVE_WINDOW');
    
    const windowHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ window: this.activeWindow, evidence: evidencePayload }))
      .digest('hex');

    this.activeWindow.status = 'LOCKED';
    this.activeWindow.windowHash = windowHash;

    logger.info('AUDIT_WINDOW_LOCKED', { id: this.activeWindow.id, windowHash });
    
    return this.activeWindow;
  }

  static getActiveWindow(): AuditWindow | null {
    return this.activeWindow;
  }
}
