import { NextResponse } from 'next/server';
import { RoutingBrain, RoutingMode } from '@/lib/gateway/routingBrain';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/gateway/route
 * Select the optimal AI provider for a given request.
 */
export const POST = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const body = await req.json();
    const { prompt, routing_mode, seed } = body;

    if (seed === true) {
      const result = await RoutingBrain.seedRoutingMetrics();
      return NextResponse.json({ message: 'Seeded routing metrics', ...result });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const mode = (routing_mode || 'auto') as RoutingMode;

    const decision = await RoutingBrain.selectModel(mode, { orgId: context.orgId });

    return NextResponse.json(decision);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

/**
 * GET /api/gateway/route
 * Fetch current routing metrics for display.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { data: metrics, error } = await (req as any).supabase
      ? await (req as any).supabase.from('routing_metrics').select('*')
      : await (await import('@/lib/supabaseServer')).supabaseServer.from('routing_metrics').select('*');

    if (error) throw error;
    return NextResponse.json(metrics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
