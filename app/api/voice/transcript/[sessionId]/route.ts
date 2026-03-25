import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/voice/transcript/[sessionId]
 * 
 * Performance-optimized endpoint for real-time transcript polling.
 * Returns only the session turns (speaker, text, risk_score, timestamp).
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { sessionId } = context.params;
    const { orgId } = context;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const { data: turns, error } = await supabaseServer
      .from('session_turns')
      .select('role, content, incremental_risk, created_at')
      .eq('session_id', sessionId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('VOICE_TRANSCRIPT_FETCH_FAILED', { sessionId, error: error.message });
      return NextResponse.json({ error: 'FAILED_TO_FETCH_TRANSCRIPT' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      turns: (turns || []).map(t => ({
        speaker: t.role === 'assistant' ? 'agent' : 'user',
        text: t.content,
        risk_score: t.incremental_risk,
        timestamp: t.created_at
      }))
    });
  } catch (err: any) {
    logger.error('VOICE_TRANSCRIPT_API_CRITICAL_ERROR', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
