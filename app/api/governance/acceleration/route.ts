import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * API: /api/governance/acceleration
 * 
 * Computes deterministic Risk Acceleration at Agent Version level.
 * Acceleration = Momentum(t) - Momentum(t-1)
 */
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { agent_id, agent_version } = body;

    if (!agent_id || !agent_version) {
      return NextResponse.json({ error: 'Missing agent_id or agent_version' }, { status: 400 });
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Call deterministic acceleration RPC
    const { data: score, error: rpcError } = await supabaseServer.rpc('compute_agent_version_acceleration', {
      p_org_id: orgId,
      p_agent_id: agent_id,
      p_agent_version: agent_version
    });

    if (rpcError) {
      logger.error('ACCELERATION_RPC_FAILED', { orgId, agent_id, agent_version, error: rpcError.message });
      return NextResponse.json({ error: 'ACCELERATION_CALCULATION_FAILED' }, { status: 500 });
    }

    logger.info('ACCELERATION_COMPUTED', { orgId, agent_id, agent_version, score });

    return NextResponse.json({
      success: true,
      data: {
        agent_id,
        agent_version,
        acceleration_score: score
      }
    });

  } catch (error: any) {
    logger.error('ACCELERATION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
