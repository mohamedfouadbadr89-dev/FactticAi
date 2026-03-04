import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CrossSessionEngine } from '@/lib/intelligence/crossSessionEngine';

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { org_id, timeframe = 24 } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    }

    // RBAC: Verify user explicitly belongs to org_id
    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute Deterministic Cross-Session Clustering Engine
    const { patterns, riskIndex, totalScanned } = await CrossSessionEngine.analyzeOrg(org_id, timeframe);

    // Provide detailed clustering mapping exactly to user request
    const clusterDistribution = {
      hallucinations: patterns.filter(p => p.pattern_type === 'hallucination_cluster').length,
      policy: patterns.filter(p => p.pattern_type === 'policy_violation_cluster').length,
      tone: patterns.filter(p => p.pattern_type === 'tone_degradation_cluster').length,
      behavior_drift: patterns.filter(p => p.pattern_type === 'agent_behavior_shift').length
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
}
