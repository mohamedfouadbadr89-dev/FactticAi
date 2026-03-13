import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { BehaviorForensicsEngine } from '@/lib/forensics/behaviorForensicsEngine';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { params }: AuthContext) => {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const analysis = await BehaviorForensicsEngine.analyzeSession(sessionId);

    if (!analysis) {
      return NextResponse.json({ error: 'Session not found or analysis failed' }, { status: 404 });
    }

    return NextResponse.json(analysis, { status: 200 });

  } catch (err: any) {
    logger.error('BEHAVIOR_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
