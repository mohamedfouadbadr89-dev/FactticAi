import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyApiKey } from '@/lib/security/verifyApiKey';
/**
 * GET /api/governance/sessions/[sessionId]/turns
 *
 * Returns governance events for a session shaped as Turn objects
 * for the TurnTimeline component in the Forensics dashboard.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyApiKey(req);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const verifiedOrgId = authResult.org_id;
    const { sessionId } = await params;

    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Map each governance event to a pair of turns (user prompt + assistant decision)
    const turns: any[] = [];
    let turnIndex = 0;

    for (const row of data || []) {
      // User turn: the submitted prompt
      if (row.prompt) {
        turns.push({
          id: `${row.id}-user`,
          role: 'user',
          content: row.prompt,
          turn_index: turnIndex++,
          incremental_risk: 0,
          factors: [],
        });
      }

      // Assistant turn: the governance decision
      const violations = Array.isArray(row.violations) ? row.violations : [];
      turns.push({
        id: `${row.id}-assistant`,
        role: 'assistant',
        content: `Decision: ${row.decision} | Risk Score: ${row.risk_score}${violations.length > 0 ? ` | Violations: ${violations.length}` : ''}`,
        turn_index: turnIndex++,
        incremental_risk: (row.risk_score ?? 0) / 100,
        factors: violations.map((v: any) => ({
          type: v.rule_type || v.policy_name || 'unknown',
          weight: (v.actual_score ?? 0) / 100,
        })),
      });
    }

    return NextResponse.json(turns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
