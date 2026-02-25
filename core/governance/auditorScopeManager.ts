import { CURRENT_REGION } from '@/config/regions';
import { AuditSimulationViolation } from '@/types/externalTrust';
import { logger } from '@/lib/logger';

/**
 * Institutional Auditor Scope Manager (v5.3)
 * 
 * CORE PRINCIPLE: Scope Confinement.
 * Enforces read-only access with strict region and time bindings.
 */
export class AuditorScopeManager {
  private static readonly TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 4; // 4 Hours

  /**
   * Validates if a session request is within the allowed auditor scope.
   */
  static validateScope(token: string, region: string): { scopeId: string; valid: boolean } {
    const [id, timestamp] = token.split('_');
    const tokenTime = parseInt(timestamp);
    const now = Date.now();

    // 1. Region Binding Enforcement
    if (region !== CURRENT_REGION) {
      throw new AuditSimulationViolation(`SCOPE_REGION_MISMATCH: Expected ${CURRENT_REGION}, got ${region}`);
    }

    // 2. Time-bound Enforcement
    if (now - tokenTime > this.TOKEN_EXPIRY_MS) {
      throw new AuditSimulationViolation('AUDITOR_SESSION_EXPIRED');
    }

    logger.info('AUDITOR_SCOPE_VERIFIED', { scopeId: id, region });

    return { scopeId: id, valid: true };
  }
}
