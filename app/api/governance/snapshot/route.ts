import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/snapshot
 * 
 * Returns the latest immutable governance snapshot for the organization.
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
    const { org_id } = await resolveOrgContext(session.user.id);
    if (!org_id) {
       return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('governance_snapshot_v1')
      .select('*')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('SNAPSHOT_FETCH_FAILED', { org_id, error: error.message });
      return NextResponse.json({ error: 'SNAPSHOT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data || null
    });

  } catch (error: any) {
    logger.error('SNAPSHOT_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
