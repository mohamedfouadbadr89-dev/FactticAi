import { NextResponse } from 'next/server';
import { GovernanceStateEngine } from '@/lib/governance/governanceStateEngine';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter' }, { status: 400 });
    }

    const state = await GovernanceStateEngine.getGovernanceState(orgId);

    return NextResponse.json(state);
  } catch (err: any) {
    logger.error('API_GOVERNANCE_STATE_ERROR', { error: err.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
