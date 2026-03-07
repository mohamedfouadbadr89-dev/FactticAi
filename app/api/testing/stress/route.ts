import { NextRequest, NextResponse } from 'next/server';
import { StressTestingEngine } from '@/lib/testing/stressTestingEngine';
import { logger } from '@/lib/logger';
import { verifyApiKey } from '@/lib/security/verifyApiKey';

/**
 * Stress Test Initiation API
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyApiKey(req);
    if ('error' in authResult || authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const org_id = authResult.org_id;

    const { concurrency, duration_seconds } = await req.json();

    if (!concurrency) {
      return NextResponse.json({ error: 'concurrency is required' }, { status: 400 });
    }

    // Trigger the stress test in the background or wait if short
    const result = await StressTestingEngine.runStressTest({
      org_id,
      concurrency: parseInt(concurrency),
      duration_seconds: parseInt(duration_seconds || '5')
    });

    if (!result) {
      return NextResponse.json({ error: 'Stress test failed to execute' }, { status: 500 });
    }

    return NextResponse.json({ result }, { status: 200 });

  } catch (err: any) {
    logger.error('STRESS_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
