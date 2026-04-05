import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { RuntimeInterceptor } from '@/lib/governance/runtimeInterceptor';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/runtime/intercept
 * External access to the Facttic Governance Runtime Interceptor.
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { session_id, model_name, response_text, seed } = body;

    if (seed) {
      const result = await RuntimeInterceptor.seedDemoData(orgId);
      return NextResponse.json({ success: true, seeded: result.count });
    }

    if (!session_id || !model_name || !response_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intercept = await RuntimeInterceptor.intercept({
      org_id: orgId,
      session_id,
      model_name,
      response_text
    });

    return NextResponse.json({ intercept });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

/**
 * GET /api/runtime/intercept
 * Fetch recent intercepts for dashboard.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get('seed') === 'true';

    if (seed) {
      await RuntimeInterceptor.seedDemoData(orgId);
    }

    const { data: events, error: fetchError } = await supabaseServer
      .from('runtime_intercepts')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;

    const stats = {
      total: events.length,
      blocked: events.filter(e => e.action === 'block').length,
      rewritten: events.filter(e => e.action === 'rewrite').length,
      avg_risk: events.length > 0 ? events.reduce((acc, e) => acc + Number(e.risk_score), 0) / events.length : 0
    };

    return NextResponse.json({ events, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
