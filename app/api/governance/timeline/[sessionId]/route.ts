import { NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { buildTimeline } from '@/lib/replay/timelineBuilder';

/**
 * GET /api/governance/timeline/{sessionId}
 *
 * Returns governance events for a session from the evidence ledger,
 * mapped to the ForensicsTimeline event shape.
 */
export async function GET(
  req: Request,
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
    
    const { sessionId } = await params;
    
    // Use the standard buildTimeline utility for consistency
    const result = await buildTimeline(sessionId);

    if (!result) {
      return NextResponse.json({ error: 'TIMELINE_BUILD_FAILED' }, { status: 500 });
    }

    // Return the timeline array directly for this endpoint
    return NextResponse.json(result.timeline);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
