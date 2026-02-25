import crypto from 'node:crypto';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { logger } from '@/lib/logger';

/**
 * Institutional Exception Ledger (v5.1)
 * 
 * CORE PRINCIPLE: Non-Repudiation of Failure.
 * Records control failures and tracks remediation for SOC2 audit.
 */

export type ExceptionStatus = "OPEN" | "IN_REMEDIATION" | "RESOLVED";

export interface ExceptionEntry {
  id: string;
  timestamp: string;
  controlId: string;
  failureReason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ExceptionStatus;
  remedyAction?: string;
  integritySignature: string;
}

export class ExceptionLedger {
  private static exceptions: ExceptionEntry[] = [];

  /**
   * Records a new control failure exception.
   */
  static async recordFailure(controlId: string, reason: string, severity: ExceptionEntry['severity']): Promise<ExceptionEntry> {
    const timestamp = new Date().toISOString();
    const id = `EXC-${controlId}-${Date.now()}`;
    
    const dataToSign = JSON.stringify({ id, controlId, reason, severity, timestamp });
    
    // Sign the exception for immutability
    const signature = crypto
      .sign(null, Buffer.from(dataToSign), (TrustBoundary as any).privateKey)
      .toString('hex');

    const entry: ExceptionEntry = {
      id,
      timestamp,
      controlId,
      failureReason: reason,
      severity,
      status: 'OPEN',
      integritySignature: signature
    };

    this.exceptions.unshift(entry);
    logger.error('GOVERNANCE_EXCEPTION_RECORDED', { id, controlId, severity });

    return entry;
  }

  static getActiveExceptions(): ExceptionEntry[] {
    return this.exceptions;
  }

  static async updateStatus(id: string, status: ExceptionStatus, action?: string): Promise<boolean> {
    const entry = this.exceptions.find(e => e.id === id);
    if (!entry) return false;

    entry.status = status;
    if (action) entry.remedyAction = action;
    
    logger.info('GOVERNANCE_EXCEPTION_UPDATED', { id, exceptionStatus: status });
    return true;
  }
}
