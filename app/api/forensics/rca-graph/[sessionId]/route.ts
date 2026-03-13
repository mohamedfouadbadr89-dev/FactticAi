import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { RcaGraphEngine } from '@/lib/forensics/rcaGraphEngine';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { orgId, params }: AuthContext) => {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const rcaData = await RcaGraphEngine.analyzeSession(sessionId, orgId);

    if (!rcaData) {
      return NextResponse.json({ error: 'RCA analysis failed or session not found.' }, { status: 404 });
    }

    return NextResponse.json(rcaData, { status: 200 });

  } catch (err: any) {
    logger.error('RCA_GRAPH_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
