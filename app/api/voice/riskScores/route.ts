import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { getRiskScoresByConversationId } from '@/src/database/voiceRiskScores';
import { logger } from '@/lib/logger';

/**
 * GET /api/voice/riskScores?conversationId=<id>
 * Returns risk scores for a specific voice conversation.
 * Auth: Supabase session cookie via withAuth()
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const scores = await getRiskScoresByConversationId(conversationId, orgId);

    return NextResponse.json({ success: true, riskScores: scores ?? [] });

  } catch (error: any) {
    logger.error('VOICE_RISK_SCORES_FETCH_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
