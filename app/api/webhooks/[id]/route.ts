import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * DELETE /api/webhooks/[id] — disable a webhook endpoint
 */
export const DELETE = withAuth(async (req: Request, { orgId }: AuthContext) => {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: existing } = await supabaseServer
    .from('webhook_endpoints')
    .select('id')
    .eq('id', id)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

  const { error } = await supabaseServer
    .from('webhook_endpoints')
    .update({ is_active: false })
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });

  return NextResponse.json({ success: true });
});
