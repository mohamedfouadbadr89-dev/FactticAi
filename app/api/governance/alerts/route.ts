import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/alerts
 * 
 * Retrieves the latest governance escalations and alerts.
 * Wraps: public.governance_escalation_log
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    // Query escalation log with org isolation
    const { data, error } = await supabaseServer
      .from('governance_escalation_log')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('GOVERNANCE_ALERTS_FETCH_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'ALERTS_FETCH_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_ALERTS_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
