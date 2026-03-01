import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/snapshot
 * 
 * Retrieves the latest governance snapshot for a specific agent version.
 * Wraps: public.governance_snapshot_v1
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agent_id = searchParams.get('agent_id');
    const agent_version = searchParams.get('agent_version');

    if (!agent_id || !agent_version) {
      return NextResponse.json({ error: 'Missing agent_id or agent_version' }, { status: 400 });
    }

    const supabase = await createServerAuthClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Query established view with org isolation
    const { data, error } = await supabaseServer
      .from('governance_snapshot_v1')
      .select('*')
      .eq('org_id', orgId)
      .eq('agent_id', agent_id)
      .eq('agent_version', agent_version)
      .single();

    if (error) {
      logger.error('GOVERNANCE_SNAPSHOT_FETCH_FAILED', { orgId, agent_id, agent_version, error: error.message });
      return NextResponse.json({ error: 'SNAPSHOT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_SNAPSHOT_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
