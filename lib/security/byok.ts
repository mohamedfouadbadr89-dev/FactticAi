import { hashApiKey } from '../hash';
import { EncryptionVault } from './encryptionVault';

/**
 * BYOK Security Helper
 * 
 * This module facilitates the "Bring Your Own Key" architecture by ensuring
 * that all incoming provider keys are immediately processed into non-reversible hashes,
 * AND as reversible but shielded encrypted blobs.
 */
export const SecurityLayer = {
  /**
   * Processes a raw key from a connection attempt.
   * Ensures the raw key is only held in volatile memory long enough to hash.
   */
  secureKeyReference: (rawKey: string) => {
    return hashApiKey(rawKey);
  },

  /**
   * Securely encrypts a provider key for reversible use by the AI Gateway.
   */
  encryptKey: async (rawKey: string, orgId: string) => {
    return await EncryptionVault.encryptField(rawKey, orgId);
  }
};
