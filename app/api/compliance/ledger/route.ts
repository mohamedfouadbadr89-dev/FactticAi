import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('*')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('LEDGER_API_FETCH_FAILED', { error: error.message, orgId });
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    return NextResponse.json({ events: data || [] }, { status: 200 });

  } catch (err: any) {
    logger.error('LEDGER_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
