import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { StressTestingEngine } from '@/lib/testing/stressTestingEngine';
import { logger } from '@/lib/logger';

/**
 * Stress Test Initiation API
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const { concurrency, duration_seconds } = await req.json();

    if (!concurrency) {
      return NextResponse.json({ error: 'concurrency is required' }, { status: 400 });
    }

    const result = await StressTestingEngine.runStressTest({
      org_id: orgId,
      concurrency: Math.min(parseInt(concurrency), 50),
      duration_seconds: Math.min(parseInt(duration_seconds || '5'), 30),
    });

    if (!result) {
      return NextResponse.json({ error: 'Stress test failed to execute' }, { status: 500 });
    }

    return NextResponse.json({ result }, { status: 200 });

  } catch (err: any) {
    logger.error('STRESS_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
