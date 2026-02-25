import crypto from 'node:crypto';
import { logger } from '@/lib/logger';

export interface SignedKPIPayload {
  metrics: {
    healthScore: number;
    riskLevel: string;
    drift: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
    concurrency?: number;
  };
  orgId: string;
  timestamp: string;
  signature: string;
}

/**
 * Telemetry Integrity Manager (v4.8.3)
 * Enforces cryptographic bonding between Pipeline outputs and UI displays.
 */
export class TelemetryIntegrityManager {
  private static readonly SECRET = process.env.TELEMETRY_SECRET || 'static_governance_secret_v4.8';

  static signPayload(metrics: any, orgId: string): SignedKPIPayload {
    const timestamp = new Date().toISOString();
    const dataToSign = JSON.stringify({ metrics, orgId, timestamp });
    
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(dataToSign)
      .digest('hex');

    return {
      metrics,
      orgId,
      timestamp,
      signature
    };
  }

  static validatePayload(payload: SignedKPIPayload): boolean {
    const { metrics, orgId, timestamp, signature } = payload;
    
    // 1. Check Drift (≤ 5s)
    const now = new Date();
    const payloadTime = new Date(timestamp);
    const drift = Math.abs(now.getTime() - payloadTime.getTime()) / 1000;

    if (drift > 5) {
      logger.error('TELEMETRY_DESYNC_EVENT', { reason: 'DRIFT_EXCEEDED', drift });
      return false;
    }

    // 2. Verify Signature
    const dataToVerify = JSON.stringify({ metrics, orgId, timestamp });
    const expectedSignature = crypto
      .createHmac('sha256', this.SECRET)
      .update(dataToVerify)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error('TELEMETRY_DESYNC_EVENT', { reason: 'SIGNATURE_MISMATCH' });
      return false;
    }

    return true;
  }
}
