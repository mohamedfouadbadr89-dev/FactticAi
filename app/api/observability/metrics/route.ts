import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, ctx: AuthContext) => {
  try {
    const orgId = ctx.orgId;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    // 1. Governance Latency (Avg over last hour)
    const { data: events, error: latencyErr } = await supabaseServer
      .from('facttic_governance_events')
      .select('latency, risk_score')
      .eq('org_id', orgId)
      .gte('created_at', oneHourAgo);

    if (latencyErr) throw latencyErr;

    const eventCount = events?.length || 0;
    const validLatencies = (events || []).map(e => Number(e.latency) || 0);
    const avgLatencyMs = validLatencies.length > 0 
      ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length 
      : 0;

    // 2. Risk Distribution (Last hour)
    let low = 0, medium = 0, high = 0;
    (events || []).forEach(e => {
      const risk = Number(e.risk_score) || 0;
      if (risk < 30) low++;
      else if (risk < 70) medium++;
      else high++;
    });

    // 3. Alert Frequency (Alerts triggered in last hour)
    const { count: alertCount, error: alertErr } = await supabaseServer
      .from('governance_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', oneHourAgo);

    if (alertErr) throw alertErr;

    // 4. Event Throughput (Events per minute average in the last hour)
    const throughputPerMinute = eventCount / 60;

    const metrics = {
      governance_latency_ms: Math.round(avgLatencyMs),
      risk_distribution: {
        low,
        medium,
        high
      },
      alert_frequency_last_hour: alertCount || 0,
      event_throughput_per_min: Number(throughputPerMinute.toFixed(2)),
      total_evaluations: eventCount,
      timestamp: now.toISOString()
    };

    return NextResponse.json(metrics, { status: 200 });

  } catch (error: any) {
    logger.error('METRICS_EXPORT_FAILED', { error: error.message, orgId: ctx.orgId });
    return NextResponse.json({ error: 'Failed to retrieve observability metrics' }, { status: 500 });
  }
});
