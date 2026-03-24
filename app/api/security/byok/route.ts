import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { EncryptionVault } from '@/lib/security/encryptionVault';

/**
 * BYOK Management API
 */

// GET: Return current BYOK status
export const GET = withAuth(async (req: Request, ctx: AuthContext) => {
  const { orgId } = ctx;

  const { data, error } = await supabaseServer
    .from('org_encryption_keys')
    .select('key_fingerprint, created_at, rotated_at, is_active')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    is_configured: !!data,
    fingerprint: data?.key_fingerprint || null,
    last_rotated: data?.rotated_at || data?.created_at || null,
    created_at: data?.created_at || null
  });
});

// POST: Save/Rotate master key
export const POST = withAuth(async (req: Request, ctx: AuthContext) => {
  const { orgId } = ctx;
  const { key } = await req.json();

  if (!key || key.length < 32) {
    return NextResponse.json({ error: 'Key must be at least 32 characters.' }, { status: 400 });
  }

  try {
    await EncryptionVault.rotateKey(orgId, key);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// DELETE: Reset/Remove BYOK configuration
export const DELETE = withAuth(async (req: Request, ctx: AuthContext) => {
  const { orgId } = ctx;

  const { error } = await supabaseServer
    .from('org_encryption_keys')
    .update({ is_active: false })
    .eq('org_id', orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
