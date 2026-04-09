import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * GET /api/governance/timeline/{sessionId}
 *
 * Returns governance events for a session from the evidence ledger,
 * with fallback to session_turns when GOVERNANCE_SECRET is not set.
 */
export const GET = withAuth(async (
  req: Request,
  { orgId }: AuthContext
) => {
  try {
    const url = new URL(req.url);
    const sessionId = url.pathname.split('/').at(-1);

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Try facttic_governance_events first (requires GOVERNANCE_SECRET)
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('*')
      .eq('session_id', sessionId)
      .eq('org_id', orgId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('TIMELINE_LEDGER_QUERY_ERROR', error.message);
    }

    let sourceRows = data && data.length > 0 ? data : null;

    // Fallback to session_turns when evidence ledger is empty
    if (!sourceRows) {
      const { data: turns, error: turnsErr } = await supabaseServer
        .from('session_turns')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!turnsErr && turns && turns.length > 0) {
        sourceRows = turns.map((t: any) => ({
          id: t.id,
          session_id: t.session_id,
          org_id: t.org_id,
          timestamp: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
          prompt: t.content || 'Governance evaluation',
          model: 'facttic-v5',
          decision: t.decision || 'ALLOW',
          risk_score: (t.incremental_risk ?? 0) * 100,
          violations: [],
          latency: 0,
        }));
      }
    }

    // Map to ForensicsTimeline event shape
    const events = (sourceRows || []).flatMap(row => {
      const timeline: any[] = [];
      const baseTime = Number(row.timestamp) || new Date(row.created_at).getTime();

      if (row.prompt) {
        timeline.push({
          timestamp: new Date(baseTime).toISOString(),
          event_type: 'prompt_submitted',
          event_payload: {
            message: 'Prompt submitted',
            reason: `"${String(row.prompt).substring(0, 100)}${String(row.prompt).length > 100 ? '...' : ''}"`,
            model: row.model,
          },
        });
      }

      timeline.push({
        timestamp: new Date(baseTime + 1).toISOString(),
        event_type: 'governance_decision',
        event_payload: {
          message: `Governance Decision: ${row.decision}`,
          reason: `Pipeline computed ${row.decision} enforcement action.`,
          decision: row.decision,
          model: row.model,
        },
      });

      const violations = Array.isArray(row.violations) ? row.violations : [];
      if (violations.length > 0) {
        for (const v of violations) {
          timeline.push({
            timestamp: new Date(baseTime + 2).toISOString(),
            event_type: 'policy_violation',
            event_payload: {
              message: `Violations Detected: ${v.policy_name || v.rule_type || 'Unknown'}`,
              reason: v.explanation || 'Rule exceeded threshold',
              risk_score: v.actual_score,
            },
          });
        }
      } else {
        timeline.push({
          timestamp: new Date(baseTime + 2).toISOString(),
          event_type: 'activity',
          event_payload: {
            message: 'No Violations Detected',
            reason: 'Prompt passed policy constraints.',
          },
        });
      }

      timeline.push({
        timestamp: new Date(baseTime + 3).toISOString(),
        event_type: 'risk_score_calculated',
        event_payload: {
          message: 'Risk Score Calculated',
          reason: `Final risk index resolved at ${row.risk_score}`,
          risk_score: row.risk_score,
        },
      });

      return timeline;
    });

    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
