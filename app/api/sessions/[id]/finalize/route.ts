import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * API: /api/sessions/[id]/finalize
 * 
 * Finalizes a session, updates its status and total aggregated risk.
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

    const { total_risk } = body;

    if (total_risk === undefined) {
      return NextResponse.json({ error: 'Missing total_risk' }, { status: 400 });
    }

    // 1. Finalize Session via RPC
    const { data: success, error } = await supabaseServer.rpc('finalize_session', {
      p_session_id: sessionId,
      p_org_id: orgId,
      p_total_risk: total_risk
    });

    if (error || !success) {
      logger.error('SESSION_FINALIZE_FAILED', { error, sessionId, orgId });
      return NextResponse.json({ error: 'Failed to finalize session' }, { status: 500 });
    }

    // 2. Compute Executive Intelligence Metrics (Phase 3)
    const { data: metrics, error: metricsError } = await supabaseServer.rpc('compute_executive_metrics', {
      p_org_id: orgId
    });

    if (metricsError) {
      logger.error('EXECUTIVE_METRICS_COMPUTE_FAILED', { error: metricsError, orgId });
      // Non-blocking: we continue even if intelligence fails to finalize the UI
    } else {
      // 3. Evaluate Alert Escalation
      const { error: alertError } = await supabaseServer.rpc('evaluate_alert_escalation', {
        p_org_id: orgId
      });
      if (alertError) {
        logger.error('ALERT_ESCALATION_FAILED', { error: alertError, orgId });
      }
    }

    return NextResponse.json({
      success: true,
      data: { finalized: true, metrics: metrics || null }
    });

  } catch (error: any) {
    logger.error('FINALIZE_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
