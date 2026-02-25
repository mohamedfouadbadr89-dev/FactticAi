import { NextResponse } from 'next/server';
import { ExecutiveComplianceSummary } from '@/core/governance/executiveComplianceSummary';
import { CURRENT_REGION } from '@/config/regions';

/**
 * Public Trust Snapshot API (v5.4)
 * 
 * CORE PRINCIPLE: Public Transparency.
 * Provides a high-level, non-sensitive snapshot of the system's compliance state.
 */
export async function GET() {
  try {
    const summary = ExecutiveComplianceSummary.generateSummary();
    
    // Non-sensitive public view
    const publicSnapshot = {
      status: 'VERIFIED_STABLE',
      region: CURRENT_REGION,
      complianceStandard: 'SOC2_TYPE_I',
      controlCoverage: summary.controlCoverage,
      auditState: summary.complianceState,
      trustLevel: summary.trustLevel,
      lastVerified: summary.timestamp,
      proofHash: summary.signature.substring(0, 16) // Only expose partial signature
    };

    return NextResponse.json(publicSnapshot, {
      headers: {
        'Cache-Control': 'public, s-maxage=300',
        'X-Trust-Protocol': 'HDI-v5.4'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'TRUST_SNAPSHOT_UNAVAILABLE' }, { status: 503 });
  }
}
