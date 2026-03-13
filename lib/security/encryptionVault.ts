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
   * Supports AWS KMS and local AES256-GCM.
   */
  static async encryptField(data: string, orgId: string): Promise<string> {
    try {
      const keyConfig = await this.getOrgKey(orgId);
      
      if (!keyConfig) {
        throw new Error('No active encryption key found for organization');
      }

      if (keyConfig.key_provider === 'local') {
        return this.encryptLocal(data, keyConfig.key_reference);
      } else if (keyConfig.key_provider === 'aws_kms') {
        // Mock AWS KMS integration - in production, this would call AWS SDK
        logger.info('ENCRYPT_VIA_AWS_KMS', { orgId, keyRef: keyConfig.key_reference });
        return this.encryptLocal(data, `kms_mock_key_${keyConfig.key_reference}`);
      }

      throw new Error(`Unsupported key provider: ${keyConfig.key_provider}`);
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
      const keyConfig = await this.getOrgKey(orgId);
      
      if (!keyConfig) {
        throw new Error('No active encryption key found for organization');
      }

      if (keyConfig.key_provider === 'local') {
        return this.decryptLocal(cipher, keyConfig.key_reference);
      } else if (keyConfig.key_provider === 'aws_kms') {
        logger.info('DECRYPT_VIA_AWS_KMS', { orgId, keyRef: keyConfig.key_reference });
        return this.decryptLocal(cipher, `kms_mock_key_${keyConfig.key_reference}`);
      }

      throw new Error(`Unsupported key provider: ${keyConfig.key_provider}`);
    } catch (err: any) {
      logger.error('DECRYPTION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Rotates an organization's key by creating a new version.
   */
  static async rotateKey(orgId: string): Promise<string> {
    try {
      // 1. Revoke existing active keys
      await supabaseServer
        .from('org_encryption_keys')
        .update({ key_status: 'rotated' })
        .eq('org_id', orgId)
        .eq('key_status', 'active');

      // 2. Generate new key reference (Deterministic for demo, unique in production)
      const newRef = crypto.randomBytes(32).toString('hex');
      
      const { data, error } = await supabaseServer
        .from('org_encryption_keys')
        .insert({
          org_id: orgId,
          key_reference: newRef,
          key_provider: 'local', // Defaulting to local for internal isolation
          key_status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('KEY_ROTATION_SUCCESS', { orgId, newKeyId: data.id });
      return data.key_reference;
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
      .eq('key_status', 'active')
      .single();
    
    // Fallback for demo: auto-generate if missing
    if (!data) {
      logger.warn('KEY_MISSING_AUTO_GENERATING', { orgId });
      const ref = await this.rotateKey(orgId);
      return { key_reference: ref, key_provider: 'local' };
    }

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
