import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * API: /api/sessions
 * 
 * Creates a new risk-monitored session.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const supabase = await createServerAuthClient();
    
    // 1. Auth & Session Extraction
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    // 1. Create Session via RPC
    const { data: sessionId, error } = await supabaseServer.rpc('create_session', {
      p_org_id: orgId,
      p_agent_id: agent_id
    });

    if (error) {
      logger.error('SESSION_CREATE_FAILED', { error, orgId, agent_id });
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { session_id: sessionId }
    });

  } catch (error: any) {
    logger.error('SESSION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
