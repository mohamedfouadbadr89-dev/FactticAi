import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/trend
 * Wraps: public.governance_snapshot_v1
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

    // 🔥 Fix: convert null → undefined explicitly
    const agent_id: string | undefined =
      searchParams.get('agent_id') ?? undefined;

    const projection: boolean =
      searchParams.get('projection') === 'true';

    const { org_id } = await resolveOrgContext(session.user.id);

    if (!org_id) {
      return NextResponse.json(
        { error: 'ORG_CONTEXT_MISSING' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('governance_snapshot_v1')
      .select('*')
      .eq('org_id', org_id);

    if (agent_id !== undefined) {
      query = query.eq('agent_id', agent_id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('GOVERNANCE_TREND_FETCH_FAILED', {
        org_id,
        agent_id,
        error: error.message,
      });

      return NextResponse.json(
        { error: 'TREND_DATA_NOT_FOUND' },
        { status: 404 }
      );
    }

    const enrichedData = (data ?? []).map((item: any) => {
      const acc =
        typeof item.acceleration === 'string'
          ? JSON.parse(item.acceleration)
          : item.acceleration;

      const result: any = {
        ...item,
        acceleration: acc?.acceleration ?? 0,
      };

      if (projection) {
        result.projection = {
          projected_next_risk:
            acc?.projected_next_risk ?? 0,
          projected_sessions_to_threshold:
            acc?.projected_sessions_to_threshold ?? 999,
        };
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      data: enrichedData,
    });

  } catch (err: unknown) {
    logger.error('GOVERNANCE_TREND_API_ERROR', {
      error:
        err instanceof Error
          ? err.message
          : 'UNKNOWN_ERROR',
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});