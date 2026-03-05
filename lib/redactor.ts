/**
 * PII Redactor Utility
 * 
 * Provides regex-based redaction for sensitive information to ensure
 * data sovereignty and compliance (PII/GDPR) before logging or storage.
 */

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /(?:\B\+|\b)(?:\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b|(?:\B\+|\b)(?:\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{4}\b/g,
  ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  passport: /\b[A-Z][0-9]{7,8}\b/ig,
};

/**
 * Redacts PII from a string or object
 * @param input - The text or object to redact
 * @param orgId - Optional orgId to trigger encryption before redaction
 * @returns The redacted version
 */
export const redactPII = async (input: any, orgId?: string): Promise<any> => {
  if (typeof input === 'string') {
    let redacted = input;

    // Pattern-based encryption: If orgId is provided, encrypt sensitive data segments
    if (orgId) {
      const { EncryptionVault } = await import('./security/encryptionVault');
      
      const encryptAndMark = async (match: string, type: string) => {
        const encrypted = await EncryptionVault.encryptField(match, orgId);
        return `[${type}_ENCRYPTED:${encrypted.substring(0, 10)}...]`;
      };

      if (PII_PATTERNS.email.test(redacted)) {
        redacted = await replaceAsync(redacted, PII_PATTERNS.email, (m) => encryptAndMark(m, 'EMAIL'));
      }
      if (PII_PATTERNS.creditCard.test(redacted)) {
        redacted = await replaceAsync(redacted, PII_PATTERNS.creditCard, (m) => encryptAndMark(m, 'CARD'));
      }
      // Continue for other critical patterns...
    } else {
      redacted = redacted.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
      redacted = redacted.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
      redacted = redacted.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
      redacted = redacted.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
      redacted = redacted.replace(PII_PATTERNS.ipv4, '[IP_REDACTED]');
      redacted = redacted.replace(PII_PATTERNS.passport, '[PASSPORT_REDACTED]');
    }
    
    return redacted;
  }

  if (Array.isArray(input)) {
    return Promise.all(input.map(item => redactPII(item, orgId)));
  }

  if (input !== null && typeof input === 'object') {
    const redactedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        redactedObj[key] = await redactPII(input[key], orgId);
      }
    }
    return redactedObj;
  }

  return input;
};

// Helper for async replacements
async function replaceAsync(str: string, regex: RegExp, asyncFn: (match: string) => Promise<string>) {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match) => {
    promises.push(asyncFn(match));
    return match;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift() || '');
}
