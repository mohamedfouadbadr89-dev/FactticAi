import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * GET /api/governance/sessions/[sessionId]/turns
 *
 * Returns turn data for the TurnTimeline component in the Forensics dashboard.
 * Tries facttic_governance_events first, falls back to session_turns.
 */
export const GET = withAuth(async (
  req: Request,
  { orgId }: AuthContext
) => {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const sessionIdx = parts.indexOf('sessions');
    const sessionId = sessionIdx >= 0 ? parts[sessionIdx + 1] : null;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Try facttic_governance_events first
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('*')
      .eq('session_id', sessionId)
      .eq('org_id', orgId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('TURNS_LEDGER_QUERY_ERROR', error.message);
    }

    let turns: any[] = [];

    if (data && data.length > 0) {
      // Map governance events to turn pairs
      let turnIndex = 0;
      for (const row of data) {
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
    } else {
      // Fallback to session_turns
      const { data: turnRows, error: turnsErr } = await supabaseServer
        .from('session_turns')
        .select('*')
        .eq('session_id', sessionId)
        .order('turn_index', { ascending: true });

      if (!turnsErr && turnRows && turnRows.length > 0) {
        turns = turnRows.map((t: any, i: number) => ({
          id: t.id || `turn-${i}`,
          role: t.role || 'user',
          content: t.content || `Decision: ${t.decision}`,
          turn_index: t.turn_index ?? i,
          incremental_risk: t.incremental_risk ?? 0,
          factors: [],
        }));
        // Add an assistant response turn for each user turn
        const enriched: any[] = [];
        for (const turn of turns) {
          enriched.push(turn);
          if (turn.role === 'user') {
            const t = turnRows.find((r: any) => r.turn_index === turn.turn_index);
            enriched.push({
              id: `${turn.id}-response`,
              role: 'assistant',
              content: `Decision: ${t?.decision || 'ALLOW'} | Risk: ${((t?.incremental_risk ?? 0) * 100).toFixed(0)}%`,
              turn_index: turn.turn_index + 0.5,
              incremental_risk: t?.incremental_risk ?? 0,
              factors: [],
            });
          }
        }
        turns = enriched;
      }
    }

    return NextResponse.json(turns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
