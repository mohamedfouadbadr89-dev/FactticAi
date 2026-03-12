import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { CrossSessionEngine } from '@/lib/intelligence/crossSessionEngine';

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { timeframe = 24 } = body;

    const { patterns, riskIndex, totalScanned } = await CrossSessionEngine.analyzeOrg(orgId, timeframe);

    const clusterDistribution = {
      hallucinations: patterns.filter((p: any) => p.pattern_type === 'hallucination_cluster').length,
      policy: patterns.filter((p: any) => p.pattern_type === 'policy_violation_cluster').length,
      tone: patterns.filter((p: any) => p.pattern_type === 'tone_degradation_cluster').length,
      behavior_drift: patterns.filter((p: any) => p.pattern_type === 'agent_behavior_shift').length
    };

    return NextResponse.json({
      pattern_clusters: patterns,
      risk_index: riskIndex,
      cluster_distribution: clusterDistribution,
      total_scanned: totalScanned
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
