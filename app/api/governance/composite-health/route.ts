import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/composite-health
 * 
 * Returns the weighted Governance Health Composite Index (0-100).
 * Aggregates: Risk, Momentum, Drift, Alerts, Severity.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerAuthClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { org_id } = await resolveOrgContext(session.user.id);

    if (!org_id) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Call deterministic composite index RPC
    const { data: score, error: rpcError } = await supabaseServer.rpc('compute_governance_composite_index', {
      p_org_id: org_id
    });

    if (rpcError) {
      logger.error('COMPOSITE_HEALTH_RPC_FAILED', { org_id, error: rpcError.message });
      return NextResponse.json({ error: 'COMPOSITE_CALCULATION_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        composite_health: score,
        components: {
          risk_weight: 0.30,
          drift_weight: 0.20,
          alert_weight: 0.15,
          severity_weight: 0.20,
          momentum_weight: 0.15
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error: any) {
    logger.error('COMPOSITE_HEALTH_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
