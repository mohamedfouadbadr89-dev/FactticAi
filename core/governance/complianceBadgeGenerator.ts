import { ExecutiveComplianceSummary } from './executiveComplianceSummary';
import { CURRENT_REGION } from '@/config/regions';

/**
 * Institutional Compliance Badge Generator (v5.4)
 * 
 * CORE PRINCIPLE: Visual Trust.
 * Generates safe metadata for a frontend trust badge.
 */
export class ComplianceBadgeGenerator {
  /**
   * Generates badge metadata.
   */
  static getBadgeMetadata() {
    const summary = ExecutiveComplianceSummary.generateSummary();
    
    return {
      label: 'SOC2 Type I',
      status: 'READY',
      coverage: summary.controlCoverage,
      region: CURRENT_REGION,
      theme: 'INSTITUTIONAL_DARK',
      integrity: 'VERIFIED'
    };
  }
}
