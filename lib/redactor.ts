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
 * @returns The redacted version
 */
export const redactPII = (input: any): any => {
  if (typeof input === 'string') {
    let redacted = input;
    redacted = redacted.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.ipv4, '[IP_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.passport, '[PASSPORT_REDACTED]');
    return redacted;
  }

  if (Array.isArray(input)) {
    return input.map(redactPII);
  }

  if (input !== null && typeof input === 'object') {
    const redactedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        // Skip keys that are usually safe but check their values
        redactedObj[key] = redactPII(input[key]);
      }
    }
    return redactedObj;
  }

  return input;
};
