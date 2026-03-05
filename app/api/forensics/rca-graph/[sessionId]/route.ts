import { NextRequest, NextResponse } from 'next/server';
import { RcaGraphEngine } from '@/lib/forensics/rcaGraphEngine';
import { logger } from '@/lib/logger';

/**
 * RCA Causal Graph API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const rcaData = await RcaGraphEngine.analyzeSession(sessionId);

    if (!rcaData) {
      return NextResponse.json({ error: 'RCA analysis failed or session not found.' }, { status: 404 });
    }

    return NextResponse.json(rcaData, { status: 200 });

  } catch (err: any) {
    logger.error('RCA_GRAPH_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
