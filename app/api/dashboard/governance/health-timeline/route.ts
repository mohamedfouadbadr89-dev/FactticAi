import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Governance Health Timeline API
 * 
 * Fetches and aggregates risk metrics into health scores across timeframes.
 * Logic: health = 100 - avg(risk_score)
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');
    const range = searchParams.get('range') || '24h'; // 24h, 7d, 30d

    if (!org_id) {
      return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    }

    let timeframeMs = 24 * 60 * 60 * 1000;
    if (range === '7d') timeframeMs = 7 * 24 * 60 * 60 * 1000;
    if (range === '30d') timeframeMs = 30 * 24 * 60 * 60 * 1000;

    const sinceDate = new Date(Date.now() - timeframeMs).toISOString();

    const { data, error } = await supabaseServer
      .from('governance_risk_metrics')
      .select('risk_score, created_at')
      .eq('org_id', org_id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: true })
      .limit(1000);

    if (error) throw error;

    // Aggregation: Group by hour (or day for longer ranges)
    // For simplicity in this implementation, we'll return raw data points 
    // and let the client handle rendering/interpolation
    const timeline = data.map(d => ({
      timestamp: d.created_at,
      risk: d.risk_score,
      health: Math.max(0, 100 - d.risk_score)
    }));

    return NextResponse.json({ timeline });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
