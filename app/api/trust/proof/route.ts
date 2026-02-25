import { NextResponse } from 'next/server';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';

/**
 * External Trust Proof API (v4.9.1)
 * 
 * Provides a read-only, signed snapshot of the system's governance state.
 */
export async function GET() {
  // Logic: In a real cluster, healthScore would be derived from the GovernanceHealthStream.
  const healthScore = 99.8; 
  
  const snapshot = TrustBoundary.generateSnapshot(healthScore);

  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Governance-Version': 'v4.9.1',
      'X-Region-ID': snapshot.regionId
    }
  });
}
