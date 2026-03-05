import { NextRequest, NextResponse } from 'next/server';
import { computeHallucinationRisk } from '@/lib/intelligence/hallucinationRisk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
  }

  const signal = await computeHallucinationRisk(sessionId);

  if (!signal) {
    return NextResponse.json({ error: 'Failed to compute hallucination risk or session not found' }, { status: 404 });
  }

  return NextResponse.json({
    session_id: sessionId,
    hallucination_risk: signal.riskScore,
    cluster_reference: {
      cluster_id: signal.clusterId,
      fingerprint: signal.fingerprint,
      occurrence_count: signal.frequency
    }
  });
}
