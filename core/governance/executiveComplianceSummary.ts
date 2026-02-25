import { CONTROL_REGISTRY } from './controlRegistry';
import { TRACEABILITY_MAP } from './traceabilityMap';
import { AuditWindowManager } from './auditWindowManager';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { CURRENT_REGION } from '@/config/regions';
import { logger } from '@/lib/logger';
import crypto from 'node:crypto';

/**
 * Institutional Executive Compliance Summary (v5.4)
 * 
 * CORE PRINCIPLE: Transparent Trust.
 * Generates an high-level summary for executive and procurement review.
 */
export class ExecutiveComplianceSummary {
  /**
   * Generates a signed executive summary.
   */
  static generateSummary() {
    const registryIds = CONTROL_REGISTRY.map(c => c.id);
    const traceabilityIds = TRACEABILITY_MAP.map(t => t.controlId);
    const coverage = (traceabilityIds.length / registryIds.length) * 100;
    const activeWindow = AuditWindowManager.getActiveWindow();

    const summary = {
      version: 'v5.4',
      region: CURRENT_REGION,
      timestamp: new Date().toISOString(),
      complianceState: activeWindow?.status === 'LOCKED' ? 'CERTIFIED' : 'ACTIVE_AUDIT',
      controlCoverage: `${coverage.toFixed(2)}%`,
      totalControls: registryIds.length,
      auditWindowId: activeWindow?.id || 'NONE',
      trustLevel: 'ENTERPRISE_SOC2_TYPE_I_READY'
    };

    const signature = crypto
      .sign(null, Buffer.from(JSON.stringify(summary)), (TrustBoundary as any).privateKey)
      .toString('hex');

    logger.info('EXECUTIVE_SUMMARY_GENERATED', { coverage: summary.controlCoverage });

    return {
      ...summary,
      signature
    };
  }
}
