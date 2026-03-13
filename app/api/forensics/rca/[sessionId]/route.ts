import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { RcaEngine } from '@/lib/forensics/rcaEngine';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { orgId, params }: AuthContext) => {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session identifier' }, { status: 400 });
    }

    const rcaReport = await RcaEngine.analyzeIncident(sessionId, orgId);

    if (!rcaReport) {
      return NextResponse.json({ error: 'RCA Analysis failed or session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rcaReport });

  } catch (error: any) {
    logger.error('RCA_ROUTE_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
