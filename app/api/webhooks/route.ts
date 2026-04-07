import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

const VALID_EVENTS = ['*', 'RISK_BLOCK', 'RISK_WARN', 'POLICY_VIOLATION', 'DRIFT_DETECTED', 'HALLUCINATION_DETECTED'];

/**
 * GET /api/webhooks — list all webhook endpoints for the org
 */
export const GET = withAuth(async (_req: Request, { orgId }: AuthContext) => {
  const { data, error } = await supabaseServer
    .from('webhook_endpoints')
    .select('id, name, url, events, is_active, created_at, last_triggered_at')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });

  return NextResponse.json({ webhooks: data ?? [] });
});

/**
 * POST /api/webhooks — register a new webhook endpoint
 * Body: { name, url, events? }
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? '').trim();
  const url = (body?.url ?? '').trim();
  const events: string[] = body?.events ?? ['*'];

  if (!name || name.length < 2 || name.length > 64) {
    return NextResponse.json({ error: 'name must be 2–64 characters' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 400 });
  }

  const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    return NextResponse.json({ error: `Unknown events: ${invalidEvents.join(', ')}` }, { status: 400 });
  }

  const secret = randomBytes(32).toString('hex');

  const { data, error } = await supabaseServer
    .from('webhook_endpoints')
    .insert({ org_id: orgId, name, url, events, secret, is_active: true })
    .select('id, name, url, events, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });

  return NextResponse.json({
    webhook: { ...data, secret }, // secret shown ONCE
  }, { status: 201 });
});
