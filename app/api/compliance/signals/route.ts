import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateStart = searchParams.get('date_start');
    const dateEnd = searchParams.get('date_end');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseServer
      .from('compliance_signals')
      .select('*')
      .eq('org_id', orgId);

    if (dateStart) query = query.gte('created_at', dateStart);
    if (dateEnd) query = query.lte('created_at', dateEnd);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('COMPLIANCE_SIGNALS_FETCH_FAILED', { error: error.message, orgId });
      return NextResponse.json({ signals: [] }, { status: 200 });
    }

    return NextResponse.json({ signals: data || [] }, { status: 200 });

  } catch (err: any) {
    logger.error('COMPLIANCE_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
