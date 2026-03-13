import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/investigations
 *
 * Retrieves active governance investigations.
 * Filters drift_alerts where lifecycle_status is 'investigating'.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    // Query active alerts from drift_alerts — 'status' is the correct column name
    const { data, error } = await supabaseServer
      .from('drift_alerts')
      .select(`
        *,
        governance_root_cause_reports (*)
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('GOVERNANCE_INVESTIGATIONS_FETCH_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'INVESTIGATIONS_FETCH_FAILED' }, { status: 500 });
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
