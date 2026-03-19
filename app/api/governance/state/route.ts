import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernanceStateEngine } from '@/lib/governance/governanceStateEngine';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (request: Request, { orgId }: AuthContext) => {
  try {
    const state = await GovernanceStateEngine.getGovernanceState(orgId);
    return NextResponse.json(state);
  } catch (err: any) {
    logger.error('API_GOVERNANCE_STATE_ERROR', { error: err.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
