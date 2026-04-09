import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/investigations
 *
 * Retrieves open governance investigations (incidents with status 'open').
 * Sources from the `incidents` table which GovernancePipeline now writes to.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { data, error } = await supabaseServer
      .from('incidents')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'open')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      // Table may not exist yet — return empty gracefully
      logger.warn('GOVERNANCE_INVESTIGATIONS_FETCH_FAILED', { orgId, error: error.message });
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({
      success: true,
      data: data ?? []
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_INVESTIGATIONS_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
