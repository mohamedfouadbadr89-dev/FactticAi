import { AuditWindowManager } from './auditWindowManager';
import { EvidenceScheduler, type EvidenceCycleSnapshot } from './evidenceScheduler';
import { TRACEABILITY_MAP } from './traceabilityMap';
import { CONTROL_REGISTRY } from './controlRegistry';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { logger } from '@/lib/logger';
import crypto from 'node:crypto';

/**
 * Institutional Evidence Bundle Exporter (v5.3)
 * 
 * CORE PRINCIPLE: Deterministic Manifests.
 * Generates a signed package for external auditors with coverage context.
 */
export class EvidenceBundleExporter {
  /**
   * Exports a complete, signed evidence bundle.
   */
  static async exportBundle(cycleSnapshot: EvidenceCycleSnapshot): Promise<{
    manifest: string;
    signature: string;
    auditWindowId: string | null;
  }> {
    const activeWindow = AuditWindowManager.getActiveWindow();
    
    // Coverage Summary Calculation
    const registryIds = CONTROL_REGISTRY.map(c => c.id);
    const traceabilityIds = TRACEABILITY_MAP.map(t => t.controlId);
    const coverage = (traceabilityIds.length / registryIds.length) * 100;

    const manifestData = {
      bundleVersion: 'v5.3',
      exportTimestamp: new Date().toISOString(),
      auditWindow: activeWindow,
      evidence: cycleSnapshot,
      integrityHash: activeWindow?.windowHash || 'UNLOCKED',
      coverageSummary: {
        totalControls: registryIds.length,
        mappedControls: traceabilityIds.length,
        percentage: `${coverage.toFixed(2)}%`
      }
    };

    const manifest = JSON.stringify(manifestData);
    
    // Sign the entire bundle manifest
    const signature = crypto
      .sign(null, Buffer.from(manifest), (TrustBoundary as any).privateKey)
      .toString('hex');

    logger.info('AUDIT_BUNDLE_EXPORTED', { 
      windowId: activeWindow?.id, 
      coverage: coverage.toFixed(2)
    });

    return {
      manifest,
      signature,
      auditWindowId: activeWindow?.id || null
    };
  }
}
