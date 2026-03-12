import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { RegressionEngine } from '@/lib/intelligence/regressionEngine';

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { model_version, timeframe = 24 } = body;

    if (!model_version) {
      return NextResponse.json({ error: 'Missing model_version parameter.' }, { status: 400 });
    }

    const { signals, driftMagnitude, topSeverity } = await RegressionEngine.executeRegressionScan(orgId, model_version, timeframe);

    return NextResponse.json({
      regression_signals: signals,
      drift_magnitude: driftMagnitude,
      severity: topSeverity
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
