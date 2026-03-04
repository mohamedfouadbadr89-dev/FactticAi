import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { AutonomousGovernor } from '@/lib/governance/autonomousGovernor';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/governance/autonomous/run
 * Trigger an autonomous governance evaluation or seed demo actions.
 */
export const POST = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const body = await req.json();
    const { seed, risk_score, signals, model, session_id } = body;

    if (seed === true) {
      const result = await AutonomousGovernor.seedDemoActions(context.orgId);
      return NextResponse.json({ message: 'Seeded autonomous actions', ...result });
    }

    if (!risk_score || !signals || !model) {
      return NextResponse.json({ error: 'Missing evaluation context: risk_score, signals, model' }, { status: 400 });
    }

    const decision = await AutonomousGovernor.evaluateAndRun(context.orgId, {
      risk_score,
      signals,
      model,
      session_id
    });

    return NextResponse.json({ decision });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

/**
 * GET /api/governance/autonomous/run
 * Fetch recent autonomous actions.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { data: actions, error } = await supabaseServer
      .from('autonomous_actions')
      .select('*')
      .eq('org_id', context.orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(actions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
