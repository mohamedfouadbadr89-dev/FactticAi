import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/redis';
import { supabaseServer } from '@/lib/supabaseServer';
import { RiskScoringEngine } from '@/lib/riskScoringEngine';
import { AlertEngine } from '@/lib/alerts/alertEngine';
import crypto from 'crypto';

/**
 * Public API Evaluation Route (v1)
 * Features: API Key Auth, Rate Limiting, Deterministic Scoring
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate API Key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: keyRecord, error: keyError } = await supabaseServer
      .from('api_keys')
      .select('org_id, name')
      .eq('hashed_key', hashedKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyRecord) {
      return NextResponse.json({ error: 'INVALID_API_KEY' }, { status: 401 });
    }

    const orgId = keyRecord.org_id;

    // 2. Rate Limiting (100 requests per minute per org)
    const rateLimitKey = `rl:api_v1:${orgId}`;
    const count = await cache.atomicIncrement(rateLimitKey, 60);
    if (count > 100) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
    }

    // 3. Process Evaluation
    const body = await req.json();
    const { interaction_id, payload } = body;

    if (!interaction_id || !payload) {
      return NextResponse.json({ error: 'MISSING_PAYLOAD' }, { status: 400 });
    }

    const evaluation = await RiskScoringEngine.evaluateTurn(orgId, interaction_id, payload);

    // 4. Trigger Alerts (Fire-and-forget)
    AlertEngine.triggerAlert({
      orgId,
      type: 'PUBLIC_API_EVALUATION',
      message: `Evaluation completed for interaction ${interaction_id}`,
      risk_score: evaluation.total_risk,
      metadata: { interaction_id, evaluation }
    }).catch(err => {
      logger.error('PUBLIC_API_ALERT_FAILED', { orgId, error: err.message });
    });

    // 5. Audit Usage
    await supabaseServer
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('hashed_key', hashedKey);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      evaluation: {
        ...evaluation,
        engine_version: 'v1.0.deterministic'
      }
    });

  } catch (error: any) {
    logger.error('PUBLIC_API_V1_ERROR', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
