import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * API: /api/governance/executive-state
 * 
 * Fetches the aggregated governance state for the organization.
 * Server-side derived via Supabase RPC.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerAuthClient();
    
    // 1. Auth & Session Extraction
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. Derive Org Context Securely
    const user_id = session.user.id;
    const ctx = await resolveOrgContext(user_id);
    const orgId = ctx.org_id;

    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }


    // 1. Compute Executive State via RPC
    const { data: state, error } = await supabaseServer.rpc('compute_executive_state', {
      p_org_id: orgId
    });

    if (error) {
      logger.error('EXECUTIVE_STATE_FETCH_FAILED', { error, orgId });
      return NextResponse.json({ error: 'Failed to compute executive state' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: state
    });

  } catch (error: any) {
    logger.error('EXECUTIVE_STATE_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
