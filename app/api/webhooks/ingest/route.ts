import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { recordWebhookEvent } from '@/lib/idempotency';
import { redactPII } from '@/lib/redactor';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';
import { webhookQueue } from '@/lib/webhookQueue';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * API: /api/webhooks/ingest
 * 
 * Core Ingestion Flow with strict idempotency.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    // Solve Org Context deterministically
    const { org_id } = await resolveOrgContext(auth.user.id);

    const body = await req.json();
    const { provider, event_id, idempotency_key, payload } = body;
    const redactedPayload = typeof payload === 'object' ? redactPII(payload) : payload;

    if (!provider || !event_id || !payload) {
      return NextResponse.json({ error: "Missing required fields: provider, event_id, payload" }, { status: 400 });
    }

    const result = await recordWebhookEvent({
      org_id,
      provider,
      event_id,
      idempotency_key,
      payload: redactedPayload
    });

    if (result.duplicate) {
      return NextResponse.json({ 
        error: "Duplicate event detected", 
        idempotency_key: result.idempotency_key 
      }, { status: 409 });
    }

    // --- PHASE 3: PRODUCTION INGESTION BLOCK ---
    // If the payload contains session context, we persist it to the forensic layer
    if (redactedPayload.session_id && redactedPayload.turn_index !== undefined) {
      const { session_id, agent_id, turn_index, role, content, metadata } = redactedPayload;
      
      // 1. Evaluate Turn Risk (Deterministic)
      const { RiskScoringEngine } = await import('@/lib/riskScoringEngine');
      const score = await RiskScoringEngine.evaluateTurn(org_id, event_id, redactedPayload);

      // 2. Persist Turn to session_turns
      const { error: turnError } = await supabaseServer
        .from('session_turns')
        .insert({
          session_id,
          agent_id,
          turn_index,
          role,
          content,
          metadata,
          incremental_risk: score.total_risk,
          factors: score.factors
        });

      if (turnError) {
        logger.error('TURN_PERSISTENCE_FAILED', { session_id, error: turnError.message });
      } else {
        // 3. Trigger Session Aggregation (RPC)
        // This ensures the session's total_risk remains deterministic and sync'd
        await supabaseServer.rpc('compute_session_aggregate', { 
          p_session_id: session_id 
        });
      }
    }
    // ------------------------------------------

    // Enqueue for processing with deterministic failure handling
    const enqueued = await webhookQueue.enqueue(event_id, redactedPayload);
    
    if (!enqueued) {
      return NextResponse.json({ 
        error: "Webhook retry queue disabled",
        message: "Event recorded but background processing is unavailable" 
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      idempotency_key: result.idempotency_key,
      message: "EVENT INGESTED SUCCESSFULLY"
    });

  } catch (error: any) {
    logger.error('Webhook ingestion failed', { 
      error: error.message, 
      status: 500 
    });
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || 'Ingestion failed' },
      { status: 500 }
    );
  }
}
