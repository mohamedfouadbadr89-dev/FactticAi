import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/governance/verify-evaluation
 * 
 * Verifies the determinism of a specific evaluation event.
 * Wraps: public.verify_evaluation_determinism
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { evaluation_id } = body;

    if (!evaluation_id) {
      return NextResponse.json({ error: 'Missing evaluation_id' }, { status: 400 });
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

    // Call deterministic verification RPC
    const { data: isDeterministic, error: rpcError } = await supabaseServer.rpc('verify_evaluation_determinism', {
      p_evaluation_id: evaluation_id
    });

    if (rpcError) {
      logger.error('EVALUATION_VERIFY_FAILED', { orgId, evaluation_id, error: rpcError.message });
      return NextResponse.json({ error: 'EVALUATION_VERIFICATION_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluation_id,
        is_deterministic: isDeterministic
      }
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_VERIFY_EVALUATION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
