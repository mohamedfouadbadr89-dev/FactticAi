import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/certification
 * 
 * Retrieves the current engine certification status.
 * Wraps: public.engine_certification_v1
 */
export const GET = withAuth(async (req, { session }) => {
  try {
    const { org_id: orgId } = await resolveOrgContext(session.user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    // Query global certification view
    const { data, error } = await supabaseServer
      .from('engine_certification_v1')
      .select('*')
      .single();

    if (error) {
      logger.error('GOVERNANCE_CERTIFICATION_FETCH_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'CERTIFICATION_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_CERTIFICATION_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
