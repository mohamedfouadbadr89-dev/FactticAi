import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { RiskScoringEngine } from '@/lib/riskScoringEngine';
import { logger } from '@/lib/logger';

/**
 * API: /api/sessions/[id]/turn
 * 
 * Inserts a new turn into a session and triggers risk evaluation.
 */
export const POST = withAuth(async (req: Request, { orgId, params }: AuthContext & { params: { id: string } }) => {
  try {
    const { id: sessionId } = params;
    const body = await req.json();
    
    const { turn_index, role, content, payload } = body;

    if (turn_index === undefined || !role || !content) {
      return NextResponse.json({ error: 'Missing turn_index, role, or content' }, { status: 400 });
    }

    // 1. Evaluate Risk for this turn
    const evaluation = await RiskScoringEngine.evaluateTurn(orgId, sessionId, payload || {});

    // 2. Insert Turn via RPC
    const { data: turnId, error } = await supabaseServer.rpc('insert_session_turn', {
      p_session_id: sessionId,
      p_org_id: orgId,
      p_turn_index: turn_index,
      p_role: role,
      p_content: content,
      p_incremental_risk: evaluation.total_risk,
      p_factors: evaluation.factors,
      p_confidence: evaluation.confidence
    });

    if (error) {
      logger.error('TURN_INSERT_FAILED', { error, sessionId, orgId });
      return NextResponse.json({ error: 'Failed to insert turn' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        turn_id: turnId,
        risk: evaluation
      }
    });

  } catch (error: any) {
    logger.error('TURN_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
