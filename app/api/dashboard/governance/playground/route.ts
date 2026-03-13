import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');
    if (!org_id) return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('*')
      .eq('org_id', org_id)
      .eq('event_type', 'evaluation_created')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ 
      activity: data 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
