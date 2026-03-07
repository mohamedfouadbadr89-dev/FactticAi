import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id') || 'dbad3ca2-3907-4279-9941-8f55c3c0efdc';

    const { data, error } = await supabaseServer
      .from('governance_event_ledger')
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
