import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { GovernanceStateEngine } from '@/lib/governance/governanceStateEngine';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const authResult = await verifyApiKey(request);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

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
