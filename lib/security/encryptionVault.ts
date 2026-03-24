import crypto from 'crypto';
import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export class EncryptionVault {
  private static ALGORITHM = 'aes-256-gcm';
  private static IV_LENGTH = 16;
  private static SALT_LENGTH = 64;
  private static TAG_LENGTH = 16;

  /**
   * Encrypts a field using organization-specific keys.
   */
  static async encryptField(data: string, orgId: string): Promise<string> {
    try {
      const keyObj = await this.getOrgKey(orgId);
      if (!keyObj) throw new Error('No active encryption key found');

      // System master key used to decrypt the vault-stored org key
      const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'facttic-internal-vault-v1-fallback-key';
      const rawOrgKey = this.decryptLocal(keyObj.encrypted_key, masterKey);

      return this.encryptLocal(data, rawOrgKey);
    } catch (err: any) {
      logger.error('ENCRYPTION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Decrypts a field using organization-specific keys.
   */
  static async decryptField(cipher: string, orgId: string): Promise<string> {
    try {
      const keyObj = await this.getOrgKey(orgId);
      if (!keyObj) throw new Error('No active encryption key found');

      const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'facttic-internal-vault-v1-fallback-key';
      const rawOrgKey = this.decryptLocal(keyObj.encrypted_key, masterKey);

      return this.decryptLocal(cipher, rawOrgKey);
    } catch (err: any) {
      logger.error('DECRYPTION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Rotates or initializes an organization's key.
   */
  static async rotateKey(orgId: string, providedKey?: string): Promise<string> {
    try {
      // 1. Deactivate existing keys
      await supabaseServer
        .from('org_encryption_keys')
        .update({ is_active: false })
        .eq('org_id', orgId)
        .eq('is_active', true);

      // 2. Generate or use provided key
      const rawKey = providedKey || crypto.randomBytes(32).toString('base64');
      const fingerprint = rawKey.slice(-8);
      
      const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'facttic-internal-vault-v1-fallback-key';
      const encryptedKey = this.encryptLocal(rawKey, masterKey);
      
      const { data, error } = await supabaseServer
        .from('org_encryption_keys')
        .insert({
          org_id: orgId,
          key_fingerprint: fingerprint,
          encrypted_key: encryptedKey,
          is_active: true,
          rotated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('KEY_ROTATION_SUCCESS', { orgId, fingerprint });
      return rawKey;
    } catch (err: any) {
      logger.error('KEY_ROTATION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  // --- PRIVATE IMPLEMENTATION ---

  private static async getOrgKey(orgId: string) {
    const { data } = await supabaseServer
      .from('org_encryption_keys')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    return data;
  }

  private static encryptLocal(text: string, keyRef: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const key = crypto.scryptSync(keyRef, salt, 32);
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = (cipher as any).getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  private static decryptLocal(data: string, keyRef: string): string {
    const buffer = Buffer.from(data, 'base64');
    
    const salt = buffer.subarray(0, this.SALT_LENGTH);
    const iv = buffer.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const tag = buffer.subarray(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
    const encrypted = buffer.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);

    const key = crypto.scryptSync(keyRef, salt, 32);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    (decipher as any).setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
