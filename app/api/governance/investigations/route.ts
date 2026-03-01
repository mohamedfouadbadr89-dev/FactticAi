import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/investigations
 * 
 * Retrieves active governance investigations.
 * Filters drift_alerts where lifecycle_status is 'investigating'.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerAuthClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Query active investigations from drift_alerts
    const { data, error } = await supabaseServer
      .from('drift_alerts')
      .select(`
        *,
        governance_root_cause_reports (*)
      `)
      .eq('org_id', orgId)
      .eq('lifecycle_status', 'investigating')
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
}
