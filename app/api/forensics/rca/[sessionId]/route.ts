import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { RcaEngine } from '@/lib/forensics/rcaEngine';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { params }: AuthContext) => {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const id = params?.sessionId;
    if (!id) {
      return NextResponse.json({ error: 'Missing session identifier' }, { status: 400 });
    }

    const orgId = verifiedOrgId || '';
    if (!orgId) {
      return NextResponse.json({ error: 'org_id could not be resolved from API key' }, { status: 403 });
    }

    const rcaReport = await RcaEngine.analyzeIncident(id, orgId);

    if (!rcaReport) {
      return NextResponse.json({ error: 'RCA Analysis failed or session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rcaReport });

  } catch (error: any) {
    logger.error('RCA_ROUTE_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
