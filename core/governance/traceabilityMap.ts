/**
 * Institutional Auditor Traceability Map (v5.1)
 * 
 * CORE PRINCIPLE: Absolute Visibility.
 * Links high-level controls to source code and execution logs.
 */

export interface TraceabilityEntry {
  controlId: string;
  sourceCodeEntry: string;
  logidentifier: string;
  verificationMethod: 'AUTOMATED_TEST' | 'LOG_AUDIT' | 'CODE_REVIEW';
}

export const TRACEABILITY_MAP: TraceabilityEntry[] = [
  {
    controlId: 'AC-01',
    sourceCodeEntry: '@/middleware.ts',
    logidentifier: 'RBAC_ENFORCEMENT',
    verificationMethod: 'AUTOMATED_TEST'
  },
  {
    controlId: 'CM-01',
    sourceCodeEntry: '@/scripts/verifySignatures.js',
    logidentifier: 'COMMIT_SIGNATURE_VERIFIED',
    verificationMethod: 'CODE_REVIEW'
  },
  {
    controlId: 'IR-01',
    sourceCodeEntry: '@/lib/logger.ts',
    logidentifier: 'CRITICAL_SYSTEM_ALERT',
    verificationMethod: 'LOG_AUDIT'
  },
  {
    controlId: 'DR-01',
    sourceCodeEntry: '@/config/regions.ts',
    logidentifier: 'REGION_SOVEREIGNTY_ACK',
    verificationMethod: 'AUTOMATED_TEST'
  },
  {
    controlId: 'SDLC-01',
    sourceCodeEntry: '@/package.json',
    logidentifier: 'PIPELINE_HARDENING_SUCCESS',
    verificationMethod: 'AUTOMATED_TEST'
  }
];
