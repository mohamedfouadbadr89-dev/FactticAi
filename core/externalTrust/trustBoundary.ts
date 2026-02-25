import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { logger } from '@/lib/logger';
import { CURRENT_REGION } from '@/config/regions';
import { type ExternalTrustProof, TrustBoundaryViolation } from '@/types/externalTrust';

/**
 * Reconciled External Trust Boundary (v4.9.1)
 * 
 * CORE PRINCIPLE: Hard Deterministic Integrity.
 * Enforcement of Ed25519, Regional Residency, and Timestamp Skew.
 */
export class TrustBoundary {
  private static privateKey: string;
  public static publicKey: string;

  static {
    // Ephemeral Key Generation for simulation (In prod, load from Vault)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  static generateSnapshot(healthScore: number): ExternalTrustProof {
    let commitHash = 'unknown';
    try {
      commitHash = execSync('git rev-parse HEAD').toString().trim();
    } catch (e) {
      logger.warn('TRUST_BOUNDARY: Failed to resolve git commit hash');
    }

    const timestamp = new Date().toISOString();
    const dataToSign = JSON.stringify({
      version: 'v4.9.1',
      commitHash,
      regionId: CURRENT_REGION,
      healthScore,
      timestamp
    });

    const signature = crypto.sign(null, Buffer.from(dataToSign), this.privateKey).toString('hex');

    return {
      version: 'v4.9.1',
      commitHash,
      regionId: CURRENT_REGION,
      healthScore,
      timestamp,
      signature,
      publicKey: this.publicKey
    };
  }

  /**
   * Hard Deterministic Validation
   * @throws TrustBoundaryViolation if integrity check fails.
   */
  static verifySnapshot(snapshot: ExternalTrustProof): boolean {
    const { signature, publicKey, ...data } = snapshot;
    const dataToVerify = JSON.stringify(data);
    
    // 1. Enforce Regional Binding
    if (data.regionId !== CURRENT_REGION) {
      throw new TrustBoundaryViolation(`REGION_MISMATCH: Expected ${CURRENT_REGION}, got ${data.regionId}`);
    }

    // 2. Enforce 5-second Skew Limit
    const now = new Date();
    const payloadTime = new Date(data.timestamp);
    const drift = Math.abs(now.getTime() - payloadTime.getTime()) / 1000;

    if (drift > 5) {
      throw new TrustBoundaryViolation(`TIMESTAMP_SKEW_EXCEEDED: Drift is ${drift.toFixed(2)}s`);
    }

    // 3. Enforce Ed25519 Signature
    const isValid = crypto.verify(
      null,
      Buffer.from(dataToVerify),
      publicKey,
      Buffer.from(signature, 'hex')
    );

    if (!isValid) {
      throw new TrustBoundaryViolation('INVALID_CRYPTOGRAPHIC_SIGNATURE');
    }

    return true;
  }
}
