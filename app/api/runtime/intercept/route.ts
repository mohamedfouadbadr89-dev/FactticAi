import { NextRequest, NextResponse } from 'next/server';
import { RuntimeInterceptor } from '@/lib/governance/runtimeInterceptor';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/runtime/intercept
 * External access to the Facttic Governance Runtime Interceptor (Phase 48).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, model_name, response_text, seed } = body;

    // RBAC check: extract user from session
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org_id for user
    const { data: member, error: memberError } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Organization mapping failed' }, { status: 403 });
    }

    if (seed) {
      const result = await RuntimeInterceptor.seedDemoData(member.org_id);
      return NextResponse.json({ success: true, seeded: result.count });
    }

    if (!session_id || !model_name || !response_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intercept = await RuntimeInterceptor.intercept({
      org_id: member.org_id,
      session_id,
      model_name,
      response_text
    });

    return NextResponse.json({ intercept });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/runtime/intercept
 * Fetch recent intercepts for dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get('seed') === 'true';

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (seed) {
      await RuntimeInterceptor.seedDemoData(member.org_id);
    }

    const { data: events, error: fetchError } = await supabaseServer
      .from('runtime_intercepts')
      .select('*')
      .eq('org_id', member.org_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;

    // Compute stats
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
}
