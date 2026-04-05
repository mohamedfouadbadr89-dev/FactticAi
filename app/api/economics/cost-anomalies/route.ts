import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { CostAnomalyEngine } from '@/lib/economics/costAnomalyEngine';
import { logger } from '@/lib/logger';

/**
 * Cost Anomalies API
 *
 * Returns detected token spikes and cost deviations for the authenticated org.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    await CostAnomalyEngine.detectAnomalies(orgId);
    const anomalies = await CostAnomalyEngine.getAnomalies(orgId);
    return NextResponse.json({ anomalies }, { status: 200 });
  } catch (error: any) {
    logger.error('COST_ANOMALIES_API_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
