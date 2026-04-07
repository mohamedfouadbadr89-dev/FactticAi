import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

const KEY_PREFIX_VISIBLE = 8; // chars shown after "factti_"

function generateApiKey(): { raw: string; hashed: string; prefix: string } {
  const secret = randomBytes(32).toString('hex'); // 64 hex chars
  const raw = `factti_${secret}`;
  const hashed = createHash('sha256').update(raw).digest('hex');
  const prefix = `factti_${secret.substring(0, KEY_PREFIX_VISIBLE)}`;
  return { raw, hashed, prefix };
}

/**
 * GET /api/keys
 * List all API keys for the org (never returns raw key or hash).
 */
export const GET = withAuth(async (_req: Request, { orgId }: AuthContext) => {
  const { data, error } = await supabaseServer
    .from('api_keys')
    .select('id, name, key_prefix, is_active, created_at, last_used_at')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }

  return NextResponse.json({ keys: data ?? [] });
});

/**
 * POST /api/keys
 * Create a new API key. Returns the raw key ONCE — never retrievable again.
 * Body: { name: string }
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? '').trim();

  if (!name || name.length < 2 || name.length > 64) {
    return NextResponse.json(
      { error: 'name must be between 2 and 64 characters' },
      { status: 400 }
    );
  }

  const { raw, hashed, prefix } = generateApiKey();

  const { data, error } = await supabaseServer
    .from('api_keys')
    .insert({
      org_id: orgId,
      name,
      hashed_key: hashed,
      key_prefix: prefix,
      is_active: true,
    })
    .select('id, name, key_prefix, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }

  return NextResponse.json({
    key: {
      ...data,
      raw_key: raw, // shown ONCE — not stored, not retrievable
    },
  }, { status: 201 });
});
