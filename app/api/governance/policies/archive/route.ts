import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, org_id } = body;

    if (!id || !org_id) {
      return NextResponse.json({ error: 'id and org_id are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('governance_policies')
      .update({ is_active: false })
      .eq('id', id)
      .eq('org_id', org_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, archived: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
