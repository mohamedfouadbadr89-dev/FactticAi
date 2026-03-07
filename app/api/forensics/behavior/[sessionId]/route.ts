import { NextRequest, NextResponse } from 'next/server';
import { BehaviorForensicsEngine } from '@/lib/forensics/behaviorForensicsEngine';
import { logger } from '@/lib/logger';
import { verifyApiKey } from '@/lib/security/verifyApiKey';

/**
 * Session Behavior Forensics API
 * 
 * Performs deep behavioral analysis on a specific session timeline.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyApiKey(req);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const verifiedOrgId = authResult.org_id;
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
}
