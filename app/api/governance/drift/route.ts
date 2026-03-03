import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * GET /api/governance/drift
 * Returns behavioral drift trend data for the specified timeframe.
 * Fixed in Bug B3 to use governance_predictions table.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Fetch predictions for the given timeframe (risk_momentum is our drift metric)
    const { data: predictions, error } = await supabaseServer
      .from('governance_predictions')
      .select('created_at, drift_score, current_value')
      .eq('org_id', orgId)
      .eq('metric_type', 'risk_momentum')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Process data for the chart
    const latest = predictions && predictions.length > 0 ? predictions[predictions.length - 1] : null;
    const avgScore = predictions && predictions.length > 0 
      ? predictions.reduce((acc, curr) => acc + (Number(curr.drift_score) || 0), 0) / predictions.length
      : 0;

    const driftData = {
      current: latest ? `${(Number(latest.drift_score) * 100).toFixed(1)}%` : "0.0%",
      avg_period: `${(avgScore * 100).toFixed(1)}%`,
      baseline: "0.9%", // Static baseline for v1
      history: predictions?.map(p => ({
        created_at: p.created_at,
        behavioral_drift: Number(p.drift_score)
      })) || []
    };

    return NextResponse.json({
      success: true,
      data: driftData
    });
  } catch (err: unknown) {
    logger.error('DRIFT_TREND_API_ERROR', {
      error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
