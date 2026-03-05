import { NextRequest, NextResponse } from 'next/server';
import { GovernanceMaturityEngine } from '@/lib/intelligence/governanceMaturityEngine';
import { logger } from '@/lib/logger';

/**
 * Governance Maturity API
 * 
 * Objectives:
 * 1. Trigger maturity re-calculation.
 * 2. Return historical maturity growth trends.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    // Always recalculate on read to ensure fresh executive data
    const current = await GovernanceMaturityEngine.calculateMaturity(orgId);
    const history = await GovernanceMaturityEngine.getMaturityHistory(orgId);

    return NextResponse.json({
      current,
      history
    });

  } catch (err: any) {
    logger.error('MATURITY_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
