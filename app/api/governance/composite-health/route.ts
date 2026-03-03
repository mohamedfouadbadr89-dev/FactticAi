import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/composite-health
 * 
 * Returns the global Governance Health Composite Index (v1.0.4).
 */
export const GET = withAuth(async (req, { session }) => {
  try {
    const { org_id } = await resolveOrgContext(session.user.id);
    if (!org_id) {
       return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    const { data, error } = await supabaseServer.rpc('compute_governance_health_index', {
      p_org_id: org_id
    });

    if (error) {
      logger.error('HEALTH_INDEX_RPC_FAILED', { org_id, error: error.message });
      return NextResponse.json({ error: 'HEALTH_CALCULATION_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        score: data || 0,
        status: (data || 0) > 80 ? 'EXCELLENT' : (data || 0) > 60 ? 'STABLE' : 'CRITICAL',
        integrity_signature: 'sha256:0xFACTTIC_DE_V1'
      }
    });

  } catch (error: any) {
    logger.error('HEALTH_INDEX_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
