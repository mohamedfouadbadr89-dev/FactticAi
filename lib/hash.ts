import crypto from 'crypto';

/**
 * hashApiKey
 * 
 * CORE REQUIREMENT: Facttic must NEVER store plaintext API keys.
 * This function handles deterministic SHA-256 hashing for connection references.
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}
