import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/timeseries
 * Wraps: public.governance_timeseries_v1
 */
export const GET = withAuth(async (req, { session }) => {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const { searchParams } = new URL(req.url);

    const agent_id: string | undefined =
      searchParams.get('agent_id') ?? undefined;

    const agent_version: string | undefined =
      searchParams.get('agent_version') ?? undefined;

    const { org_id } = await resolveOrgContext(session.user.id);

    if (!org_id) {
      return NextResponse.json(
        { error: 'ORG_CONTEXT_MISSING' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('governance_timeseries_v1')
      .select('*')
      .eq('org_id', org_id);

    if (agent_id !== undefined) {
      query = query.eq('agent_id', agent_id);
    }

    if (agent_version !== undefined) {
      query = query.eq('agent_version', agent_version);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('GOVERNANCE_TIMESERIES_FETCH_FAILED', {
        org_id,
        agent_id,
        agent_version,
        error: error.message,
      });

      return NextResponse.json(
        { error: 'TIMESERIES_FETCH_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });

  } catch (err: unknown) {
    logger.error('GOVERNANCE_TIMESERIES_API_ERROR', {
      error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});