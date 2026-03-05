import { NextRequest, NextResponse } from 'next/server';
import { PredictiveDriftEngine } from '@/lib/intelligence/predictiveDriftEngine';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const modelName = searchParams.get('model');

  if (!orgId || !modelName) {
    return NextResponse.json({ error: 'Missing orgId or model parameters' }, { status: 400 });
  }

  const signal = await PredictiveDriftEngine.computePredictiveDriftRisk(orgId, modelName);

  if (!signal) {
    return NextResponse.json({ 
      error: 'Insufficient data for predictive drift analysis',
      requirements: 'At least 2 historical drift data points required'
    }, { status: 422 });
  }

  return NextResponse.json(signal);
}
