import crypto from 'node:crypto';
import { logger } from '@/lib/logger';

/**
 * Institutional Evidence Redaction Layer (v5.3)
 * 
 * CORE PRINCIPLE: Data Minimization.
 * Strips PII and sensitive configurations before auditor delivery.
 */
export class EvidenceRedactionLayer {
  private static readonly PII_PATTERNS = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
    /\b\d{3}-\d{2}-\d{4}\b/g,                        // SSN (Simulated)
    /\b(user|token|key|secret|password|auth)_[\w-]{16,}\b/gi // Secret patterns
  ];

  /**
   * Deterministically redacts sensitive data from evidence strings.
   */
  static redactEvidence(evidence: string): { redactedContent: string; redactionHash: string } {
    let content = evidence;
    
    // Mask PII
    this.PII_PATTERNS.forEach(pattern => {
      content = content.replace(pattern, '[REDACTED_BY_GOVERNANCE]');
    });

    const redactionHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    logger.info('EVIDENCE_REDACTED', { hash: redactionHash.substring(0, 8) });

    return {
      redactedContent: content,
      redactionHash
    };
  }

  /**
   * Processes a batch of evidence results for redaction.
   */
  static redactResults<T extends { evidence: string }>(results: T[]): T[] {
    return results.map(r => {
      const { redactedContent } = this.redactEvidence(r.evidence);
      return { ...r, evidence: redactedContent };
    });
  }
}
