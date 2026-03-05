import { NextRequest, NextResponse } from 'next/server';
import { SessionReplayEngine } from '@/lib/replay/sessionReplayEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const replay = await SessionReplayEngine.replaySession(sessionId);

  if (!replay) {
    return NextResponse.json({ error: 'Session not found or reconstruction failed' }, { status: 404 });
  }

  return NextResponse.json({
    session_id: sessionId,
    timeline: replay.timeline,
    risk_summary: {
      total_events: replay.totalEvents,
      risk_peaks_count: replay.riskPeaks.length,
      policy_triggers_count: replay.policyTriggers.length,
      critical_indices: replay.riskPeaks.map(p => p.timestamp)
    }
  });
}
