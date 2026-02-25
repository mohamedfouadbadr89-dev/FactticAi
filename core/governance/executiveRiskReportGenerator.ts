import { StructuralHealthReport } from './structuralHealthReport';
import { ExecutiveComplianceSummary } from './executiveComplianceSummary';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { logger } from '@/lib/logger';
import crypto from 'node:crypto';

/**
 * Institutional Executive Risk Report Generator (v6.1)
 * 
 * CORE PRINCIPLE: Strategic Oversight.
 * Produces signed executive-level summaries of structural risk and health.
 */
export class ExecutiveRiskReportGenerator {
  /**
   * Generates a signed executive risk report.
   */
  static generateReport() {
    const health = StructuralHealthReport.generateReport();
    const compliance = ExecutiveComplianceSummary.generateSummary();

    const report = {
      version: 'v6.1',
      timestamp: new Date().toISOString(),
      governanceStatus: compliance.complianceState,
      structuralHealth: {
        score: health.governanceIntegrityScore,
        driftRisk: health.driftRiskPercent,
        couplingIndex: health.couplingIndex
      },
      compliancePhase: 'SOC2_TYPE_I_READY',
      regionResidency: compliance.region
    };

    const signature = crypto
      .sign(null, Buffer.from(JSON.stringify(report)), (TrustBoundary as any).privateKey)
      .toString('hex');

    logger.info('EXECUTIVE_RISK_REPORT_GENERATED', { 
      healthScore: report.structuralHealth.score 
    });

    return {
      ...report,
      signature: signature.substring(0, 32) + '...' // Masked for executive view
    };
  }
}
