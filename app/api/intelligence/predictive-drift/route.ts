import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { PredictiveDriftEngine } from '@/lib/intelligence/predictiveDriftEngine';

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  const { searchParams } = new URL(req.url);
  const modelName = searchParams.get('model');

  if (!modelName) {
    return NextResponse.json({ error: 'Missing model parameter' }, { status: 400 });
  }

  const signal = await PredictiveDriftEngine.computePredictiveDriftRisk(orgId, modelName);

  if (!signal) {
    return NextResponse.json({
      error: 'Insufficient data for predictive drift analysis',
      requirements: 'At least 2 historical drift data points required'
    }, { status: 422 });
  }

  return NextResponse.json(signal);
});
