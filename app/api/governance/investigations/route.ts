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
    // Primary source for investigations: drift_alerts — contains system-level RCA
    const { data: driftAlerts, error: driftError } = await supabaseServer
      .from('drift_alerts')
      .select('*, governance_root_cause_reports(*)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Fallback to governance_alerts for individual event flags
    const { data: eventAlerts, error: eventError } = await supabaseServer
      .from('governance_alerts')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (driftError || eventError) {
      logger.error('GOVERNANCE_INVESTIGATIONS_FETCH_FAILED', { orgId, driftError: driftError?.message, eventError: eventError?.message });
      return NextResponse.json({ error: 'INVESTIGATIONS_FETCH_FAILED' }, { status: 500 });
    }

    // Map drift_alerts → Investigation shape
    const driftInvs = (driftAlerts ?? []).map((alert: any) => ({
      id: alert.id,
      session_id: alert.governance_root_cause_reports?.[0]?.affected_session_id || alert.metadata?.session_id || null,
      triggered_by: alert.triggered_by?.replace(/_/g, ' ') ?? 'System Pattern Discovery',
      status: alert.lifecycle_status ?? alert.status ?? 'active',
      severity: alert.severity ?? 'warning',
      description: alert.description ?? 'System-level drift detection.',
      drift_score: alert.drift_score ?? alert.governance_root_cause_reports?.[0]?.confidence_score ?? 0.85, 
      created_at: alert.created_at,
      governance_root_cause_reports: alert.governance_root_cause_reports ?? [],
    }));

    // Map governance_alerts → Investigation shape (secondary)
    const eventInvs = (eventAlerts ?? []).map((alert: any) => ({
      id: alert.id,
      session_id: alert.session_id || alert.metadata?.session_id || null,
      triggered_by: alert.alert_type?.replace(/_/g, ' ') ?? 'Policy Violation',
      status: alert.severity === 'critical' ? 'investigating' : 'resolved',
      severity: alert.severity ?? 'warning',
      description: alert.metadata?.reason ?? `Alert triggered: ${alert.alert_type}`,
      drift_score: (alert.metadata?.violations?.[0]?.severity ?? 0.75), 
      created_at: alert.created_at,
      governance_root_cause_reports: [],
    }));

    // Combine and sort by date
    const allInvestigations = [...driftInvs, ...eventInvs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allInvestigations,
    });

  } catch (error: any) {
    logger.error('GOVERNANCE_INVESTIGATIONS_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
