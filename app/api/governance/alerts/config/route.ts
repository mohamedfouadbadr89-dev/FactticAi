import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/alerts/config
 * Retrieves all alert configurations for the organization.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
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
    const { data, error } = await supabaseServer
      .from('alert_configs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('FETCH_ALERTS_CONFIG_FAILED', { orgId, error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

/**
 * POST /api/governance/alerts/config
 * Creates or updates an alert configuration.
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { id, name, metric, condition, channels, is_active } = body;

    if (!name || !metric || !condition) {
      return NextResponse.json({ error: 'Missing required alerting fields' }, { status: 400 });
    }

    const payload = {
      org_id: orgId,
      name,
      metric,
      condition,
      channels: channels || [],
      is_active: is_active !== undefined ? is_active : true
    };

    let result;
    if (id) {
      result = await supabaseServer
        .from('alert_configs')
        .update(payload)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();
    } else {
      result = await supabaseServer
        .from('alert_configs')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    logger.error('SAVE_ALERTS_CONFIG_FAILED', { orgId, error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

/**
 * DELETE /api/governance/alerts/config?id=...
 */
export const DELETE = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabaseServer
      .from('alert_configs')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('DELETE_ALERTS_CONFIG_FAILED', { orgId, error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
