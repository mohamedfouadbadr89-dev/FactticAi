import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * GET /api/voice/conversations/[id]
 * 
 * Fetches full details, transcript, and governance history for a voice conversation.
 */
export const GET = withAuth(async (req: Request, { orgId, params }: any) => {
  try {
    const { id } = params;

    // 1. Fetch Session and Agent Details
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select(`
        *,
        recording_url,
        agents (
          name,
          type,
          version
        )
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (sessionError || !session) {
      logger.error('VOICE_SESSION_NOT_FOUND', { id, error: sessionError?.message });
      return NextResponse.json({ error: 'SESSION_NOT_FOUND' }, { status: 404 });
    }

    // 2. Fetch Session Turns (Transcript & Risks)
    const { data: turns, error: turnsError } = await supabaseServer
      .from('session_turns')
      .select('*')
      .eq('session_id', id)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (turnsError) {
      logger.error('VOICE_TURNS_FETCH_FAILED', { id, error: turnsError.message });
      return NextResponse.json({ error: 'TRANSCRIPT_FETCH_FAILED' }, { status: 500 });
    }

    // 3. Construct the response
    const conversationDetail = {
      id: session.id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      status: session.status,
      total_risk: session.total_risk,
      recording_url: session.recording_url ?? null,
      agent: session.agents,
      participants: ['User', session.agents?.name || 'AI Assistant'],
      transcript: turns.map(t => ({
        id: t.id,
        role: t.role,
        content: t.content,
        risk_score: t.incremental_risk,
        factors: t.factors,
        timestamp: t.created_at
      })),
      governance_timeline: turns.filter(t => t.incremental_risk > 0.1).map(t => ({
        timestamp: t.created_at,
        event: t.incremental_risk > 0.7 ? 'CRITICAL_RISK' : 'MODERATE_RISK',
        description: `Risk score ${Math.round(t.incremental_risk * 100)}% detected in turn.`,
        risk_score: t.incremental_risk
      }))
    };

    return NextResponse.json({
      success: true,
      data: conversationDetail
    });

  } catch (error: any) {
    logger.error('VOICE_CONVERSATION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
