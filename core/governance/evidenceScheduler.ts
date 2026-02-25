import crypto from 'node:crypto';
import { ControlTestingEngine, type TestResult } from './controlTestingEngine';
import { PolicyEngine, type PolicySnapshot } from './policyEngine';
import { RiskRegister, type RiskEntry } from './riskRegister';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { logger } from '@/lib/logger';

/**
 * Institutional Evidence Scheduler (v5.1)
 * 
 * CORE PRINCIPLE: Automated Continuity.
 * Manages evidence collection cycles for SOC2 Type I readiness.
 */

export type ExecutionCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface EvidenceCycleSnapshot {
  cycle: ExecutionCycle;
  timestamp: string;
  results: TestResult[];
  policyStatus: PolicySnapshot[];
  activeRisks: RiskEntry[];
  signature: string;
}

export class EvidenceScheduler {
  /**
   * Triggers a formal evidence collection cycle.
   */
  static async triggerCycle(cycle: ExecutionCycle): Promise<EvidenceCycleSnapshot> {
    logger.info('EVIDENCE_CYCLE_STARTED', { cycle });

    const results = await ControlTestingEngine.runFullAudit();
    const policyStatus = PolicyEngine.generateSnapshots();
    const activeRisks = RiskRegister.getActiveRisks();
    const timestamp = new Date().toISOString();

    const dataToSign = JSON.stringify({
      cycle,
      timestamp,
      results,
      policyStatus,
      activeRisks
    });

    // Sign the cycle snapshot using TrustBoundary keys
    const signature = crypto
      .sign(null, Buffer.from(dataToSign), (TrustBoundary as any).privateKey)
      .toString('hex');

    const snapshot: EvidenceCycleSnapshot = {
      cycle,
      timestamp,
      results,
      policyStatus,
      activeRisks,
      signature
    };

    logger.info('EVIDENCE_CYCLE_COMPLETED', { cycle, signature: signature.substring(0, 8) });

    return snapshot;
  }
}
