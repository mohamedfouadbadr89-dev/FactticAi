import { NextResponse } from 'next/server';
import { IntelligenceNetwork } from '@/lib/network/intelligenceNetwork';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/network/signal
 * Ingest anonymized governance signals from local pipelines.
 */
export const POST = withAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const { model_name, signal_type, risk_score, pattern_hash, seed } = body;

    if (seed === true) {
       const res = await IntelligenceNetwork.seedNetworkIntelligence();
       return NextResponse.json(res);
    }

    if (!model_name || !signal_type || !risk_score || !pattern_hash) {
      return NextResponse.json({ error: 'Missing signal data' }, { status: 400 });
    }

    await IntelligenceNetwork.ingestSignal({
      model_name,
      signal_type,
      risk_score,
      pattern_hash
    });

    return NextResponse.json({ status: 'ingested' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
