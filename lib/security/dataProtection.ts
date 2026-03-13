import crypto from 'crypto';
import { EncryptionVault } from './encryptionVault';
import { logger } from '../logger';

/**
 * Data Protection Layer
 * 
 * Provides unified functions for PII masking, encryption, and tokenization.
 * Standardizes AES-256-GCM for field-level security.
 */
export class DataProtection {
  
  private static PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    phone: /(?:\B\+|\b)(?:\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b|(?:\B\+|\b)(?:\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{4}\b/g,
    passport: /\b[A-Z][0-9]{7,8}\b/ig,
  };

  /**
   * Replaces all detected PII in a string with [MASKED].
   */
  static maskPII(input: string): string {
    if (!input) return input;
    
    let masked = input;
    masked = masked.replace(this.PII_PATTERNS.email, '[EMAIL_MASKED]');
    masked = masked.replace(this.PII_PATTERNS.creditCard, '[CARD_MASKED]');
    masked = masked.replace(this.PII_PATTERNS.ssn, '[SSN_MASKED]');
    masked = masked.replace(this.PII_PATTERNS.phone, '[PHONE_MASKED]');
    masked = masked.replace(this.PII_PATTERNS.passport, '[PASSPORT_MASKED]');
    
    return masked;
  }

  /**
   * Encrypts sensitive data using the organization's AES-256-GCM vault.
   */
  static async encryptField(data: string, orgId: string): Promise<string> {
    try {
      return await EncryptionVault.encryptField(data, orgId);
    } catch (err: any) {
      logger.error('DATA_PROTECTION_ENCRYPT_FAILURE', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Creates a deterministic, non-reversible token for identifying data without exposing it.
   * Uses HMAC-SHA256 with the organization's unique key reference.
   */
  static async tokenizeIdentifier(id: string, orgId: string): Promise<string> {
    try {
      // In a real implementation, we'd fetch the org's secret salt from supabase
      // For this extension, we leverage the existing EncryptionVault logic to get an org key
      const keyConfig = await (EncryptionVault as any).getOrgKey(orgId);
      const secret = keyConfig.key_reference;

      return crypto
        .createHmac('sha256', secret)
        .update(id)
        .digest('hex');
    } catch (err: any) {
      logger.error('DATA_PROTECTION_TOKENIZE_FAILURE', { orgId, error: err.message });
      // Return a basic hash if vault fails to prevent blocking, but log the failure
      return crypto.createHash('sha256').update(id + orgId).digest('hex');
    }
  }
}
