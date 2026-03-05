import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, org_id, ...updates } = body;

    if (!id || !org_id) {
      return NextResponse.json({ error: 'id and org_id are required' }, { status: 400 });
    }

    // Increment version on update
    const { data: current } = await supabaseServer
      .from('governance_policies')
      .select('version')
      .eq('id', id)
      .eq('org_id', org_id)
      .single();

    const nextVersion = (current?.version || 0) + 1;

    const { data, error } = await supabaseServer
      .from('governance_policies')
      .update({
        ...updates,
        version: nextVersion
      })
      .eq('id', id)
      .eq('org_id', org_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
