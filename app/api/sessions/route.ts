import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * API: /api/sessions
 * 
 * GET: Lists latest 50 sessions for the organization.
 * POST: Creates a new risk-monitored session.
 */

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('SESSIONS_FETCH_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data ?? []
    });

  } catch (error: any) {
    logger.error('SESSIONS_LIST_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    // Create Session via RPC
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
});
