import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/sessions
 *
 * Returns distinct sessions from the evidence ledger for the authenticated org.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const highRisk = searchParams.get('high_risk') === 'true';

    let query = supabaseServer
      .from('sessions')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (highRisk) {
      query = query.gt('total_risk', 50);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ sessions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
