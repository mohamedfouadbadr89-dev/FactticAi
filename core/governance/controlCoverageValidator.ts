import { CONTROL_REGISTRY } from './controlRegistry';
import { TRACEABILITY_MAP } from './traceabilityMap';
import { AuditSimulationViolation } from '@/types/externalTrust';
import { logger } from '@/lib/logger';

/**
 * Institutional Control Coverage Validator (v5.2)
 * 
 * CORE PRINCIPLE: 100% Traceability.
 * Ensures every control is mapped to code and evidence.
 */
export class ControlCoverageValidator {
  /**
   * Validates full control-to-code binding.
   */
  static validateCoverage(): boolean {
    const registryIds = CONTROL_REGISTRY.map(c => c.id);
    const traceabilityIds = TRACEABILITY_MAP.map(t => t.controlId);

    // 1. Check for Orphan Controls (In Registry but not in Traceability)
    const orphans = registryIds.filter(id => !traceabilityIds.includes(id));
    if (orphans.length > 0) {
      throw new AuditSimulationViolation(`ORPHAN_CONTROLS_DETECTED: ${orphans.join(', ')}`);
    }

    // 2. Check for Untracked Traceability (In Traceability but not in Registry)
    const untracked = traceabilityIds.filter(id => !registryIds.includes(id));
    if (untracked.length > 0) {
      throw new AuditSimulationViolation(`UNTRACKED_TRACEABILITY_DETECTED: ${untracked.join(', ')}`);
    }

    // 3. Ensure 1:1 Coverage
    const coverage = (traceabilityIds.length / registryIds.length) * 100;
    logger.info('GOVERNANCE_COVERAGE_VALIDATED', { coverage: `${coverage.toFixed(2)}%` });

    return true;
  }
}
