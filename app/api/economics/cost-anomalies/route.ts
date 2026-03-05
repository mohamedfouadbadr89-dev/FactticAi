import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CostAnomalyEngine } from '@/lib/economics/costAnomalyEngine';
import { logger } from '@/lib/logger';

/**
 * Cost Anomalies API
 * 
 * Returns detected token spikes and cost deviations for the authenticated org.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. Fetch org_id
    const { data: orgMember, error: orgError } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json({ error: 'Org membership not found' }, { status: 403 });
    }

    const orgId = orgMember.org_id;

    // 3. Optional: Trigger a fresh scan (active detection)
    // In a high-traffic env, this would be a CRON, but for this task we trigger on GET
    await CostAnomalyEngine.detectAnomalies(orgId);

    // 4. Retrieve anomalies
    const anomalies = await CostAnomalyEngine.getAnomalies(orgId);

    return NextResponse.json({ anomalies }, { status: 200 });

  } catch (error: any) {
    logger.error('COST_ANOMALIES_API_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
