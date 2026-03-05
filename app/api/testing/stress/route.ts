import { NextRequest, NextResponse } from 'next/server';
import { StressTestingEngine } from '@/lib/testing/stressTestingEngine';
import { logger } from '@/lib/logger';

/**
 * Stress Test Initiation API
 */
export async function POST(req: NextRequest) {
  try {
    const { org_id, concurrency, duration_seconds } = await req.json();

    if (!org_id || !concurrency) {
      return NextResponse.json({ error: 'org_id and concurrency are required' }, { status: 400 });
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
