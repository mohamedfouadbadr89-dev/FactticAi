import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { SessionIntegrity } from '@/lib/security/sessionIntegrity';
import { buildTimeline } from '@/lib/replay/timelineBuilder';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { params }: AuthContext) => {
  try {
    const sessionId = params?.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session identifier' }, { status: 400 });
    }

    // 1. Reconstruct current timeline
    const timelineResult = await buildTimeline(sessionId);
    if (!timelineResult) {
      return NextResponse.json({ error: 'Failed to reconstruct timeline' }, { status: 404 });
    }

    // 2. Verify against stored checksum
    const integrity = await SessionIntegrity.verifyIntegrity(sessionId, timelineResult.timeline);

    return NextResponse.json({ 
      success: true, 
      intact: integrity.intact,
      // Only include hashes if not intact for audit context
      details: integrity.intact ? null : {
        stored: integrity.stored,
        calculated: integrity.calculated
      }
    });

  } catch (error: any) {
    logger.error('INTEGRITY_ROUTE_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
