import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/alerts
 * Returns active governance alerts for the authenticated org.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { data, error } = await supabaseServer
      .from('governance_alerts')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table may not exist yet — return empty gracefully
      return NextResponse.json({ data: [] });
    }

    // Map governance_alerts → AlertsClient shape
    const mapped = (data || []).map((a: any) => ({
      id: a.id,
      escalation_reason: a.metadata?.reason || a.alert_type?.replace(/_/g, ' ') || 'Governance Alert',
      previous_severity: a.metadata?.previous_severity || 'info',
      new_severity: a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'high' : 'low',
      created_at: a.created_at,
      interaction_id: a.metadata?.session_id || null,
      metadata: a.metadata,
    }));

    return NextResponse.json({ data: mapped });
  } catch (err: any) {
    return NextResponse.json({ data: [] });
  }
});
