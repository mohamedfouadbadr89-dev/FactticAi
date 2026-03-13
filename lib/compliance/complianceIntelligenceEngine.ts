import { supabaseServer } from '../supabaseServer';
import { DataProtection } from '../security/dataProtection';
import { logger } from '../logger';

// PII Patterns from redactor.ts
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /(?:\B\+|\b)(?:\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b|(?:\B\+|\b)(?:\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{4}\b/g,
  passport: /\b[A-Z][0-9]{7,8}\b/ig,
};

export interface ComplianceAnalysisResult {
  session_id: string;
  org_id: string;
  pii_detected: boolean;
  sensitive_entities: Record<string, number>;
  compliance_risk_score: number;
}

/**
 * Compliance Intelligence Engine
 * 
 * CORE RESPONSIBILITY: Monitor and record sensitive data exposure (PII).
 * Provides compliance risk scoring and entity frequency analysis.
 */
export class ComplianceIntelligenceEngine {

  /**
   * Real-time compliance analysis (v1.0)
   * Scans a specific response string for PII and records compliance risk.
   */
  static async analyze(params: { 
    org_id: string; 
    session_id?: string | undefined; 
    response?: string | undefined; 
  }): Promise<ComplianceAnalysisResult | null> {
    const { org_id, session_id, response } = params;
    
    try {
      if (!response) {
        return {
          session_id: session_id || 'anonymous',
          org_id,
          pii_detected: false,
          sensitive_entities: {},
          compliance_risk_score: 0
        };
      }

      const sensitive_entities: Record<string, number> = {};
      let pii_detected = false;

      // Scan for each pattern
      for (const [key, pattern] of Object.entries(PII_PATTERNS)) {
        const matches = response.match(pattern);
        if (matches && matches.length > 0) {
          sensitive_entities[key] = matches.length;
          pii_detected = true;
        }
      }

      // Compute Risk Score
      let riskScore = 0;
      if (sensitive_entities.creditCard) riskScore += 40;
      if (sensitive_entities.passport) riskScore += 40;
      if (sensitive_entities.email) riskScore += 20;
      if (sensitive_entities.phone) riskScore += 20;
      if (sensitive_entities.ssn) riskScore += 20;
      
      const finalRiskScore = Math.min(100, riskScore);

      const result: ComplianceAnalysisResult = {
        session_id: session_id || 'anonymous',
        org_id,
        pii_detected,
        sensitive_entities,
        compliance_risk_score: finalRiskScore
      };

      // Persist Result Asynchronously
      const tokenizedSession = session_id 
        ? await DataProtection.tokenizeIdentifier(session_id, org_id)
        : 'anonymous';

      // We use fire-and-forget for persistence to comply with non-blocking constraint
      supabaseServer.from('compliance_signals').insert({
        session_id: tokenizedSession,
        org_id,
        pii_detected,
        sensitive_entities,
        compliance_risk_score: finalRiskScore
      }).then(({ error }) => {
        if (error) logger.error('COMPLIANCE_PERSISTENCE_ERROR', { error: error.message, org_id });
      });

      return result;

    } catch (err: any) {
      logger.error('COMPLIANCE_ANALYZE_FAILURE', { org_id, error: err.message });
      return null;
    }
  }

  /**
   * Scans a session for PII and records compliance signals (Historical/Batch).
   */
  static async scanSession(sessionId: string): Promise<ComplianceAnalysisResult | null> {
    try {
      const { data: session } = await supabaseServer
        .from('sessions')
        .select('org_id')
        .eq('id', sessionId)
        .single();

      if (!session) {
        logger.error('COMPLIANCE_SCAN_SESSION_NOT_FOUND', { sessionId });
        return null;
      }

      const { data: turns } = await supabaseServer
        .from('session_turns')
        .select('content')
        .eq('session_id', sessionId);

      if (!turns || turns.length === 0) {
        return {
          session_id: sessionId,
          org_id: session.org_id,
          pii_detected: false,
          sensitive_entities: {},
          compliance_risk_score: 0
        };
      }

      const allContent = turns.map(t => t.content).join(' ');
      const sensitive_entities: Record<string, number> = {};
      let pii_detected = false;

      // Scan for each pattern
      for (const [key, pattern] of Object.entries(PII_PATTERNS)) {
        const matches = allContent.match(pattern);
        if (matches && matches.length > 0) {
          sensitive_entities[key] = matches.length;
          pii_detected = true;
        }
      }

      // Compute Risk Score
      // Weights: CC/Passport (40 each), Email/Phone/SSN (20 each)
      // Max score capped at 100
      let riskScore = 0;
      if (sensitive_entities.creditCard) riskScore += 40;
      if (sensitive_entities.passport) riskScore += 40;
      if (sensitive_entities.email) riskScore += 20;
      if (sensitive_entities.phone) riskScore += 20;
      if (sensitive_entities.ssn) riskScore += 20;
      
      const finalRiskScore = Math.min(100, riskScore);

      const result: ComplianceAnalysisResult = {
        session_id: sessionId,
        org_id: session.org_id,
        pii_detected,
        sensitive_entities,
        compliance_risk_score: finalRiskScore
      };

      // Persist Result
      // We tokenize the session_id in external compliance logs to decouple PII
      const tokenizedSession = await DataProtection.tokenizeIdentifier(result.session_id, result.org_id);

      await supabaseServer.from('compliance_signals').insert({
        session_id: tokenizedSession,
        org_id: result.org_id,
        pii_detected: result.pii_detected,
        sensitive_entities: result.sensitive_entities,
        compliance_risk_score: result.compliance_risk_score
      });

      logger.info('COMPLIANCE_SCAN_COMPLETE', { sessionId, pii_detected, riskScore: finalRiskScore });

      return result;

    } catch (err: any) {
      logger.error('COMPLIANCE_SCAN_FAILURE', { sessionId, error: err.message });
      return null;
    }
  }
}
