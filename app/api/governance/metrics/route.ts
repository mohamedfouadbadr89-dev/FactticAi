import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { GovernanceAnalytics } from '@/lib/analytics/governanceMetrics';
import { logger } from '@/lib/logger';

/**
 * Unified Governance Metrics API
 * 
 * Central aggregator for Control Center telemetry.
 */
export async function GET(req: Request) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('org_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const [risk, simulation, health] = await Promise.all([
      GovernanceAnalytics.getSessionRisk(orgId),
      GovernanceAnalytics.getSimulationActivity(orgId),
      GovernanceAnalytics.getGovernanceHealth(orgId)
    ]);

    return NextResponse.json({
      session_risk: risk,
      simulation,
      governance_health: health,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    logger.error('METRICS_AGGREGATION_FAILURE', { orgId, error: err.message });
    return NextResponse.json({ error: 'Internal Metrics Failure' }, { status: 500 });
  }
}
