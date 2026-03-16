import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/investigations
 *
 * Retrieves governance investigations from governance_alerts table.
 * Maps alert records into investigation-shaped objects for the UI.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    // Query from governance_alerts — confirmed existing table
    const { data, error } = await supabaseServer
      .from('governance_alerts')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('GOVERNANCE_INVESTIGATIONS_FETCH_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'INVESTIGATIONS_FETCH_FAILED' }, { status: 500 });
    }

    // Map governance_alerts → Investigation shape expected by InvestigationsClient
    const investigations = (data ?? []).map((alert: any) => ({
      id: alert.id,
      session_id: alert.session_id ?? null,
      triggered_by: alert.alert_type?.replace(/_/g, ' ') ?? 'Governance Alert',
      status: alert.severity === 'critical' ? 'investigating' : 'resolved',
      severity: alert.severity ?? 'warning',
      description: alert.metadata?.reason ?? `Alert triggered: ${alert.alert_type}`,
      drift_score: alert.metadata?.drift_score ?? null,
      created_at: alert.created_at,
      governance_root_cause_reports: [],
    }));

    return NextResponse.json({
      success: true,
      data: investigations,
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_INVESTIGATIONS_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
