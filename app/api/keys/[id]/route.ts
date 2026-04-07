import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * DELETE /api/keys/[id]
 * Revoke (soft-delete) an API key. Sets is_active = false.
 * Only the owning org can revoke their own keys.
 */
export const DELETE = withAuth(async (req: Request, { orgId }: AuthContext) => {
  // Extract id from URL — compatible with withAuth's (req, ctx) signature
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
  }

  const { data: existing } = await supabaseServer
    .from('api_keys')
    .select('id')
    .eq('id', id)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  const { error } = await supabaseServer
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
