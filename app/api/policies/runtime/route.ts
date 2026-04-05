import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/policies/runtime
 * List all runtime policies for an organization.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { data: policies, error: fetchError } = await supabaseServer
      .from('runtime_policies')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    return NextResponse.json({ policies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

/**
 * POST /api/policies/runtime
 * Create a new runtime policy.
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { name, condition, action, enabled } = body;

    const { data: policy, error: createError } = await supabaseServer
      .from('runtime_policies')
      .insert({
        org_id: orgId,
        name,
        condition,
        action,
        enabled: enabled ?? true
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ policy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
