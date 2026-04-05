import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * PATCH /api/policies/runtime/[id]
 * Update a specific policy.
 */
export const PATCH = withAuth(async (req: Request, { params }: AuthContext) => {
  try {
    const body = await req.json();
    const { name, condition, action, enabled } = body;
    const { id } = await params;

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
});

/**
 * DELETE /api/policies/runtime/[id]
 * Remove a specific policy.
 */
export const DELETE = withAuth(async (req: Request, { params }: AuthContext) => {
  try {
    const { id } = await params;

    const { error: deleteError } = await supabaseServer
      .from('runtime_policies')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
