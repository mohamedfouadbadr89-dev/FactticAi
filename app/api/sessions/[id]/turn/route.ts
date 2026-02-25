import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { supabaseServer } from '@/lib/supabaseServer';
import { RiskScoringEngine } from '@/lib/riskScoringEngine';
import { logger } from '@/lib/logger';

/**
 * API: /api/sessions/[id]/turn
 * 
 * Inserts a new turn into a session and triggers risk evaluation.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createServerAuthClient();
    const body = await req.json();
    
    // 1. Auth & Session Extraction
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }


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
    console.error('TURN_API_ERROR:', error);
    logger.error('TURN_API_ERROR', { error: error.message, stack: error.stack });
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
