import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/policies/runtime/[id]
 * Update a specific policy.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json();
    const { name, condition, action, enabled } = body;
    const { id } = await params;

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: policy, error: updateError } = await supabaseServer
      .from('runtime_policies')
      .update({ name, condition, action, enabled })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ policy });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/policies/runtime/[id]
 * Remove a specific policy.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error: deleteError } = await supabaseServer
      .from('runtime_policies')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
