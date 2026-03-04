import { NextRequest, NextResponse } from 'next/server';
import { BehaviorProfiler } from '@/lib/intelligence/behaviorProfiler';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * GET /api/models/behavior
 * Returns model behavior reports and clusters.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const seed = searchParams.get('seed');

    if (seed === 'true') {
      const result = await BehaviorProfiler.seedDemoBehavior(context.orgId);
      return NextResponse.json({ message: 'Seeded behavior dataset', ...result });
    }

    const report = await BehaviorProfiler.getReliabilityReport(context.orgId);
    return NextResponse.json(report);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
