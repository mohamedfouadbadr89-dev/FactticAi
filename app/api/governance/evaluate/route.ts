import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { RiskScoringEngine } from '@/lib/riskScoringEngine';
import { Redis } from 'ioredis';
import { signalBus } from '@/lib/signalBus';
import { logger } from '@/lib/logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * API: /api/governance/evaluate
 * 
 * Triggers a deterministic turn-level risk evaluation.
 * Publishes result to Redis for real-time streaming.
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

    const { interaction_id, payload } = body;

    if (!interaction_id || !payload) {
      return NextResponse.json({ error: 'Missing interaction_id or payload' }, { status: 400 });
    }

    // 1. Compute Risk
    const evaluation = await RiskScoringEngine.evaluateTurn(orgId, interaction_id, payload);
    logger.info('TURN_EVALUATED', { orgId, interaction_id });
    // 2. Publish to Real-time Channel
    const channel = `risk_stream:${orgId}`;
    const message = JSON.stringify({
      type: 'TURN_RISK_UPDATE',
      interaction_id,
      ...evaluation
    });

    try {
      await redis.publish(channel, message);
    } catch {
      // Fallback to local signal bus if Redis fails
      signalBus.emit(channel, message);
    }

    return NextResponse.json({
      success: true,
      data: evaluation
    });

  } catch (error: any) {
    logger.error('EVALUATION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
