import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/governance/verify
 * 
 * Executes a deterministic validation check for an agent version.
 * Wraps: public.compute_agent_version_determinism_check
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

    // Call deterministic verification RPC
    const { data: isDeterministic, error: rpcError } = await supabaseServer.rpc('compute_agent_version_determinism_check', {
      p_org_id: orgId,
      p_agent_id: agent_id,
      p_agent_version: agent_version
    });

    if (rpcError) {
      logger.error('DETERMINISM_VERIFY_FAILED', { orgId, agent_id, agent_version, error: rpcError.message });
      return NextResponse.json({ error: 'DETERMINISM_VERIFICATION_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_id,
        agent_version,
        is_deterministic: isDeterministic
      }
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_VERIFY_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});