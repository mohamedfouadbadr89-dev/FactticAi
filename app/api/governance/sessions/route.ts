import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/governance/sessions
 *
 * Returns distinct sessions from the evidence ledger for the authenticated org.
 * For sessions with total_risk = 0 (legacy), falls back to max risk_score
 * from facttic_governance_events.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const highRisk = searchParams.get('high_risk') === 'true';

    let query = supabaseServer
      .from('sessions')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (highRisk) {
      query = query.gt('risk_score', 50);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Strict org isolation: If no sessions, return empty. Never fall back to global data.
    let sessions = data || [];

    // For sessions with total_risk = 0 (legacy data), enrich from governance events
    const zeroRiskIds = sessions
      .filter(s => !s.total_risk || s.total_risk === 0)
      .map(s => s.id);

    if (zeroRiskIds.length > 0) {
      const { data: events } = await supabaseServer
        .from('facttic_governance_events')
        .select('session_id, risk_score')
        .in('session_id', zeroRiskIds)
        .eq('org_id', orgId);

      if (events && events.length > 0) {
        // Build map: session_id → max risk_score (0–100) → decimal (0–1)
        const riskMap: Record<string, number> = {};
        for (const e of events) {
          const decimal = Math.min(1, (e.risk_score || 0) / 100);
          if (!riskMap[e.session_id] || decimal > riskMap[e.session_id]) {
            riskMap[e.session_id] = decimal;
          }
        }
        // Patch sessions in-memory
        for (const s of sessions) {
          if (riskMap[s.id] !== undefined) {
            s.total_risk = riskMap[s.id];
          }
        }
      }
    }

    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
