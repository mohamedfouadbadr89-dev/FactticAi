import { ExecutiveComplianceSummary } from './executiveComplianceSummary';
import { CONTROL_REGISTRY } from './controlRegistry';
import { logger } from '@/lib/logger';

/**
 * Institutional Procurement Security Brief Exporter (v5.4)
 * 
 * CORE PRINCIPLE: Enterprise Readiness.
 * Exports structured security posture for procurement departments.
 */
export class ProcurementSecurityBriefExporter {
  /**
   * Generates a structured procurement brief.
   */
  static generateBrief() {
    const executiveSummary = ExecutiveComplianceSummary.generateSummary();
    
    const brief = {
      briefId: `PSB-${Date.now()}`,
      executiveSummary,
      governanceModel: 'Hard Deterministic Integrity (HDI)',
      controlDomains: Array.from(new Set(CONTROL_REGISTRY.map(c => c.domain))),
      securityControlsCount: CONTROL_REGISTRY.length,
      residencyEnforcement: 'Strict Regional Isolation',
      transparencyPolicy: 'Continuous Audit Window'
    };

    logger.info('PROCUREMENT_BRIEF_EXPORTED', { briefId: brief.briefId });

    return {
      format: 'ENTERPRISE_JSON_v1',
      data: brief
    };
  }
}
