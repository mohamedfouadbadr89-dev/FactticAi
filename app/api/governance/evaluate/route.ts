import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernanceEvaluator, InteractionPayload } from '@/src/core/governance/evaluator';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/governance/evaluate
 * 
 * Performs real-time governance evaluation for an interaction (Voice, Chat, etc.)
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const payload: InteractionPayload = await req.json();

    // 1. Audit & Integrity Check
    if (!payload.session_id || !payload.content) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    // 2. Perform Evaluation
    const result = await GovernanceEvaluator.evaluateInteraction({
      ...payload,
      org_id: orgId, // Enforce orgId from auth context
      user_id: payload.user_id || userId
    });

    // 3. Persist Event to Database (Audit Trail)
    const { error: dbError } = await supabaseServer
      .from('session_turns')
      .insert({
        org_id: orgId,
        session_id: payload.session_id,
        role: 'user', // Assuming user for now, could be dynamic
        content: payload.content,
        incremental_risk: result.overall_risk,
        factors: { 
          ...result.voice_risks?.reduce((acc: any, risk: string) => ({ ...acc, [risk]: 1 }), {}),
          total_risk: result.overall_risk
        },
        confidence: result.confidence.toString(),
        created_at: result.timestamp
      });

    if (dbError) {
      logger.error('GOVERNANCE_EVENT_PERSIST_FAILED', { error: dbError });
      // We continue since the evaluation result is the priority for live mitigation
    }

    // 4. Return result for real-time mitigation
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_EVALUATION_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});