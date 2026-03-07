import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * API: /api/governance/momentum
 * 
 * Computes deterministic Risk Momentum scoring at Agent Version level.
 */
export const POST = withAuth(async (req, { session }) => {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

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

    // Call deterministic momentum RPC
    const { data: score, error: rpcError } = await supabaseServer.rpc('compute_agent_version_momentum', {
      p_org_id: orgId,
      p_agent_id: agent_id,
      p_agent_version: agent_version
    });

    if (rpcError) {
      logger.error('MOMENTUM_RPC_FAILED', { orgId, agent_id, agent_version, error: rpcError.message });
      return NextResponse.json({ error: 'MOMENTUM_CALCULATION_FAILED' }, { status: 500 });
    }

    logger.info('MOMENTUM_COMPUTED', { orgId, agent_id, agent_version, score });

    return NextResponse.json({
      success: true,
      data: {
        agent_id,
        agent_version,
        momentum_score: score
      }
    });

  } catch (error: any) {
    logger.error('MOMENTUM_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
