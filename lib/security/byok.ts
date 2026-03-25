import { hashApiKey } from '../hash';

/**
 * BYOK Security Helper
 * 
 * This module facilitates the "Bring Your Own Key" architecture by ensuring
 * that all incoming provider keys are immediately processed into non-reversible hashes.
 */
export const SecurityLayer = {
  /**
   * Processes a raw key from a connection attempt.
   * Ensures the raw key is only held in volatile memory long enough to hash.
   */
  secureKeyReference: (rawKey: string) => {
    return hashApiKey(rawKey);
  }
};
