import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/alerts
 *
 * Returns active incidents/alerts for the authenticated org.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { data, error } = await supabaseServer
      .from('facttic_incidents')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'ACTIVE')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
