import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { RegressionEngine } from '@/lib/intelligence/regressionEngine';

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { org_id, model_version, timeframe = 24 } = body;

    if (!org_id || !model_version) {
      return NextResponse.json({ error: 'Missing org_id or model_version payload parameters.' }, { status: 400 });
    }

    // RBAC Control Boundary: Verify caller is an organizational member prior to data operations. 
    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute Deterministic Read-only Regression Engine
    const { signals, driftMagnitude, topSeverity } = await RegressionEngine.executeRegressionScan(org_id, model_version, timeframe);

    return NextResponse.json({
      regression_signals: signals,
      drift_magnitude: driftMagnitude,
      severity: topSeverity
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
