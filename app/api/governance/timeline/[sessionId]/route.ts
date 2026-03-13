import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyApiKey } from '@/lib/security/verifyApiKey';

/**
 * GET /api/governance/timeline/{sessionId}
 *
 * Returns governance events for a session from the evidence ledger,
 * mapped to the ForensicsTimeline event shape.
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

    // Map to ForensicsTimeline's TimelineEvent shape:
    const events = (data || []).flatMap(row => {
      const timeline: any[] = [];
      const baseTime = Number(row.timestamp); // bigint is returned as numeric usually from Supabase SDK, but cast to be safe

      // 1. Prompt submitted (base time)
      if (row.prompt) {
        timeline.push({
          timestamp: new Date(baseTime).toISOString(),
          event_type: 'prompt_submitted',
          event_payload: {
            message: `Prompt submitted`,
            reason: `"${row.prompt.substring(0, 100)}${row.prompt.length > 100 ? '...' : ''}"`,
            model: row.model,
          },
        });
      }

      // 2. Governance decision (+1ms)
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

      // 3. Policy violations (+2ms)
      const violations = Array.isArray(row.violations) ? row.violations : [];
      if (violations.length > 0) {
        for (const v of violations) {
          timeline.push({
            timestamp: new Date(baseTime + 2).toISOString(),
            event_type: 'policy_violation',
            event_payload: {
              message: `Violations Detected: ${v.policy_name || v.rule_type || 'Unknown'}`,
              reason: v.explanation || `Rule exceeded threshold`,
              risk_score: v.actual_score,
            },
          });
        }
      } else {
        timeline.push({
          timestamp: new Date(baseTime + 2).toISOString(),
          event_type: 'activity', 
          event_payload: {
            message: `No Violations Detected`,
            reason: `Prompt passed policy constraints.`,
          },
        });
      }

      // 4. Risk Score Calculated (+3ms)
      timeline.push({
        timestamp: new Date(baseTime + 3).toISOString(),
        event_type: 'risk_score_calculated',
        event_payload: {
          message: `Risk Score Calculated`,
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
}
