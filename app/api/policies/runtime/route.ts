import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/policies/runtime
 * List all runtime policies for an organization.
 */
export async function GET(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: policies, error: fetchError } = await supabaseServer
      .from('runtime_policies')
      .select('*')
      .eq('org_id', member.org_id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    return NextResponse.json({ policies });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/policies/runtime
 * Create a new runtime policy.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, condition, action, enabled } = body;

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: policy, error: createError } = await supabaseServer
      .from('runtime_policies')
      .insert({
        org_id: member.org_id,
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
}
