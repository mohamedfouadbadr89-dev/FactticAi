import { RiskRegister } from './riskRegister';
import { PolicyEngine } from './policyEngine';
import { logger } from '@/lib/logger';

/**
 * Institutional Business Logic Drift Sentinel (v5.5)
 * 
 * CORE PRINCIPLE: Reproducible Determinism.
 * Validates that core logic remains consistent over time.
 */
export class BusinessLogicDriftSentinel {
  /**
   * Validates risk scoring reproducibility.
   */
  static validateRiskConsistency(): boolean {
    const risk = {
        id: 'TEST-RSK',
        category: 'DATA' as const,
        title: 'Consistency Check',
        inherentScore: 5,
        probability: 0.5,
        mitigatingControlIds: ['AC-01']
    };

    const firstScore = RiskRegister.calculateResidualRisk(risk);
    const secondScore = RiskRegister.calculateResidualRisk(risk);

    if (firstScore !== secondScore) {
       logger.error('BUSINESS_LOGIC_DRIFT: Risk scoring non-deterministic');
       return false;
    }

    logger.info('BUSINESS_LOGIC_SENTINEL: Risk scores consistent');
    return true;
  }

  /**
   * Validates policy hash determinism.
   */
  static validatePolicyConsistency(): boolean {
    const snapshots1 = PolicyEngine.generateSnapshots();
    const snapshots2 = PolicyEngine.generateSnapshots();

    // Comparing first snapshot ID and contentHash
    if (snapshots1[0].contentHash !== snapshots2[0].contentHash) {
       logger.error('BUSINESS_LOGIC_DRIFT: Policy hashes non-deterministic');
       return false;
    }

    return true;
  }
}
