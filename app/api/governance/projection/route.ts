import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/governance/projection
 * 
 * Returns deterministic risk projection for an agent version.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agent_id, agent_version } = body;

    if (!agent_id || !agent_version) {
      return NextResponse.json({ error: 'Missing agent_id or agent_version' }, { status: 400 });
    }

    const supabase = await createServerAuthClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { org_id } = await resolveOrgContext(session.user.id);
    if (!org_id) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Call deterministic projection RPC
    const { data, error: rpcError } = await supabaseServer.rpc('compute_risk_projection_v1', {
      p_org_id: org_id,
      p_agent_id: agent_id,
      p_agent_version: agent_version
    });

    if (rpcError) {
      logger.error('PROJECTION_RPC_FAILED', { org_id, agent_id, agent_version, error: rpcError.message });
      return NextResponse.json({ error: 'PROJECTION_CALCULATION_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    logger.error('PROJECTION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
