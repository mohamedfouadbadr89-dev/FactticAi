import crypto from 'crypto';

// The vault relies on a master key set securely in the environment
const MASTER_KEY = process.env.FACTTIC_VAULT_MASTER_KEY || crypto.randomBytes(32).toString('hex');

export class SecretsVault {
  /**
   * Encrypt generic provider tokens (e.g. LLM API Keys)
   * Returns encrypted payload
   */
  encryptProviderToken(token: string): { iv: string, encryptedData: string } {
    const iv = crypto.randomBytes(16);
    // Ensure the key is exactly 32 bytes for aes-256-cbc.
    // If we randomly generated a hex string, it's 64 chars, we only take 32.
    const key = Buffer.from(MASTER_KEY.substring(0, 32), 'utf8');
    
    // In production, ensure key buffers match algorithm requirements implicitly
    const paddedKey = crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32); 

    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(paddedKey), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv:iv.toString('hex'),
      encryptedData: encrypted
    };
  }

  /**
   * Store internal Facttic API keys associated with org identities
   */
  async storeApiKey(orgId: string, plainTextKey: string) {
    const encrypted = this.encryptProviderToken(plainTextKey);
    // In reality, this communicates to a HSM or KMS layer, then persist encrypted hash to postgres
    console.log(`Stored facttic secret for org ${orgId}`);
    return encrypted;
  }
}

export const secretsVault = new SecretsVault();
