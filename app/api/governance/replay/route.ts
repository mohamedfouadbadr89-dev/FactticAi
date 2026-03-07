import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/governance/replay
 * 
 * Replays an evaluation event to verify reproducibility.
 * Wraps: public.replay_evaluation
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
    const { evaluation_id } = body;

    if (!evaluation_id) {
      return NextResponse.json({ error: 'Missing evaluation_id' }, { status: 400 });
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Call re-simulation RPC
    const { data: replayData, error: rpcError } = await supabaseServer.rpc('replay_evaluation', {
      p_evaluation_id: evaluation_id
    });

    if (rpcError) {
      logger.error('EVALUATION_REPLAY_FAILED', { orgId, evaluation_id, error: rpcError.message });
      return NextResponse.json({ error: 'EVALUATION_REPLAY_FAILED' }, { status: 500 });
    }

    if (replayData?.error) {
       return NextResponse.json({ error: replayData.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: replayData
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_REPLAY_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
