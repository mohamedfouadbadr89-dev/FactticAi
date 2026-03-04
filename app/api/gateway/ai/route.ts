import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { AiGateway, AIProvider } from '@/lib/gateway/aiGateway';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/gateway/ai
 * Proxy requests to LLM providers through Facttic Gateway.
 */
export const POST = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const body = await req.json();
    const { provider, model, prompt } = body;

    if (!provider || !model || !prompt) {
      return NextResponse.json({ error: 'Missing required fields: provider, model, prompt' }, { status: 400 });
    }

    const result = await AiGateway.route(context.orgId, {
      provider: provider as AIProvider,
      model,
      prompt
    });

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

/**
 * GET /api/gateway/ai
 * Fetch gateway stats or seed demo data.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const searchParams = new URL(req.url).searchParams;
      const seed = searchParams.get('seed');

      if (seed === 'true') {
        const result = await AiGateway.seedDemoTraffic(context.orgId);
        return NextResponse.json({ message: 'Seeded demo traffic', ...result });
      }

      // Fetch summary stats for the dashboard
      const { data: requests, error } = await supabaseServer
        .from('gateway_requests')
        .select('*')
        .eq('org_id', context.orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Aggregations
      const byProvider = requests.reduce((acc: any, r) => {
        acc[r.provider] = (acc[r.provider] || 0) + 1;
        return acc;
      }, {});

      const avgLatency = requests.reduce((sum, r) => sum + Number(r.latency_ms), 0) / (requests.length || 1);
      const avgRisk = requests.reduce((sum, r) => sum + Number(r.risk_score), 0) / (requests.length || 1);

      return NextResponse.json({
        recent: requests.slice(0, 10),
        stats: {
          by_provider: byProvider,
          total_requests: requests.length,
          avg_latency_ms: Math.round(avgLatency),
          avg_risk_score: Math.round(avgRisk)
        }
      });

    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  });
