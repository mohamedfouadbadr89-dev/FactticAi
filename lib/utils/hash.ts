import { createHmac } from 'crypto';

/**
 * Hash API Key using HMAC SHA256
 * 
 * CORE REQUIREMENT: Raw API keys must never be stored.
 * This function uses the GOVERNANCE_SECRET as the salt.
 */
export function hashApiKey(apiKey: string): string {
  const secret = process.env.GOVERNANCE_SECRET;
  if (!secret) {
    throw new Error('GOVERNANCE_SECRET is not defined in environment.');
  }

  return createHmac('sha256', secret)
    .update(apiKey)
    .digest('hex');
}
