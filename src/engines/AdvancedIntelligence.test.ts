// @ts-nocheck
/* global describe, it, expect */
import { AdvancedIntelligence } from './AdvancedIntelligence';

describe('AdvancedIntelligence', () => {

  const testContent = "My email is test@facttic.ai and my phone is +1-555-0199. Please do not share.";

  describe('detectPIIExposure', () => {
    it('should correctly identify email and phone matches', () => {
      const result = AdvancedIntelligence.detectPIIExposure(testContent);
      expect(result.hasPII).toBe(true);
      expect(result.matches).toContainEqual({ type: 'email', value: 'test@facttic.ai' });
      expect(result.matches).toContainEqual({ type: 'phone', value: '+1-555-0199' });
    });

    it('should redact sensitive information', () => {
      const result = AdvancedIntelligence.detectPIIExposure(testContent);
      expect(result.redactedContent).toContain('[EMAIL_REDACTED]');
      expect(result.redactedContent).toContain('[PHONE_REDACTED]');
    });
  });

  describe('measureComplianceDrift', () => {
    it('should assign a high score for PII exposure', () => {
      const score = AdvancedIntelligence.measureComplianceDrift(testContent, { org_id: '123', session_id: 'abc' });
      expect(score).toBeGreaterThanOrEqual(0.4);
    });

    it('should increase score for sensitive keywords', () => {
      const score = AdvancedIntelligence.measureComplianceDrift("The password is password", { org_id: '123', session_id: 'abc' });
      expect(score).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a high risk report if score is high', () => {
      const report = AdvancedIntelligence.generateComplianceReport("My password is secret. My ssn is 123-456-7890", { org_id: '1', session_id: '1' });
      expect(report.overallRisk).toBe('high');
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.remediationSteps.length).toBeGreaterThan(0);
    });
  });

  describe('exportEvidencePackage', () => {
    it('should generate a bundle with a checksum', async () => {
      const transcript = [{ content: "Hello world" }];
      const evidence = await AdvancedIntelligence.exportEvidencePackage('session-1', transcript, { org_id: '1' });
      expect(evidence.sessionId).toBe('session-1');
      expect(evidence.checksum).toBeDefined();
      expect(evidence.report).toBeDefined();
    });
  });

});
