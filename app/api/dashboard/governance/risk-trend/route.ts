import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');
    if (!org_id) return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseServer
      .from('governance_risk_metrics')
      .select('risk_score, created_at')
      .eq('org_id', org_id)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Format for chart
    const trend = data.map(d => ({
      time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: d.risk_score
    }));

    return NextResponse.json({ trend });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
