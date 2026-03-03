import { redactPII } from '@/lib/redactor';
import { logger } from '@/lib/logger';

export interface PIIResult {
  hasPII: boolean;
  matches: { type: string; value: string }[];
  redactedContent: string;
}

export interface ComplianceReport {
  timestamp: string;
  overallRisk: 'low' | 'medium' | 'high';
  score: number;
  violations: string[];
  remediationSteps: string[];
}

export interface EvidencePackage {
  sessionId: string;
  transcript: any[];
  report: ComplianceReport;
  metadata: any;
  checksum: string;
}

/**
 * ADVANCED INTELLIGENCE ENGINE
 * Handles deep interaction analysis, PII detection, and automated compliance auditing.
 */
export class AdvancedIntelligence {
  private static PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\b(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  };

  /**
   * Scans content for PII and returns detailed matches and redacted versions.
   */
  static detectPIIExposure(content: string): PIIResult {
    const matches: { type: string; value: string }[] = [];
    
    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const found = content.match(pattern);
      if (found) {
        found.forEach(val => matches.push({ type, value: val }));
      }
    }

    const redactedContent = redactPII(content);

    return {
      hasPII: matches.length > 0,
      matches,
      redactedContent
    };
  }

  /**
   * Calculates compliance risk score (0.0 to 1.0)
   */
  static measureComplianceDrift(content: string, metadata: any): number {
    let score = 0;
    
    // 1. Check for PII (High weight)
    const pii = this.detectPIIExposure(content);
    if (pii.hasPII) score += 0.4;

    // 2. Check for sensitive keyword violations (Medium weight)
    const sensitiveKeywords = ['password', 'secret', 'key', 'token'];
    const foundKeywords = sensitiveKeywords.filter(kw => content.toLowerCase().includes(kw));
    if (foundKeywords.length > 0) score += 0.3;

    // 3. Check for sentiment/tone drift (if available)
    if (metadata?.sentiment === 'aggressive' || metadata?.tone_drift > 0.5) {
      score += 0.2;
    }

    // 4. Metadata integrity
    if (!metadata?.session_id || !metadata?.org_id) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generates a structural compliance report for audit trails.
   */
  static generateComplianceReport(content: string, metadata: any): ComplianceReport {
    const score = this.measureComplianceDrift(content, metadata);
    const pii = this.detectPIIExposure(content);
    
    const violations: string[] = [];
    const remediationSteps: string[] = [];

    if (pii.hasPII) {
      violations.push(`PII_EXPOSURE_DETECTED: ${pii.matches.map(m => m.type).join(', ')}`);
      remediationSteps.push('Implement automated redaction at the edge.');
      remediationSteps.push('Review data retention policies for this session.');
    }

    if (score > 0.7) {
      violations.push('CRITICAL_COMPLIANCE_DRIFT');
      remediationSteps.push('Quarantine session and notify DPO immediately.');
    }

    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (score > 0.7) overallRisk = 'high';
    else if (score > 0.4) overallRisk = 'medium';

    return {
      timestamp: new Date().toISOString(),
      overallRisk,
      score,
      violations,
      remediationSteps
    };
  }

  /**
   * Bundles all session evidence into a package for external audit.
   */
  static async exportEvidencePackage(sessionId: string, transcript: any[], metadata: any): Promise<EvidencePackage> {
    const fullText = transcript.map(t => t.content).join(' ');
    const report = this.generateComplianceReport(fullText, metadata);
    
    // Simple checksum (Mocked hash for performance)
    const packageString = JSON.stringify({ sessionId, transcript, report, metadata });
    const checksum = Buffer.from(packageString).toString('base64').substring(0, 32);

    logger.info('EVIDENCE_PACKAGE_GENERATED', { sessionId, riskScore: report.score });

    return {
      sessionId,
      transcript,
      report,
      metadata,
      checksum
    };
  }
}
