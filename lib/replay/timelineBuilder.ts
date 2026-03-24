import { supabaseServer } from "../supabaseServer";
import { logger } from "../logger";

export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  content: string;
  risk_score: number;
}

export interface TimelineResult {
  timeline: TimelineEvent[];
  riskPeaks: TimelineEvent[];
  policyTriggers: TimelineEvent[];
}

/**
 * Deterministic Session Timeline Builder
 * Reconstructs the chronological sequence of events for a given session.
 */
export async function buildTimeline(sessionId: string): Promise<TimelineResult | null> {
  try {

    const { data: events, error } = await supabaseServer
      .from("facttic_governance_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (error) {
      logger.error("TIMELINE_QUERY_FAILED", { sessionId, error: error.message });
      throw error;
    }

    if (!events || events.length === 0) {
      // Fallback: Check session_turns if ledger is empty (for legacy or non-ledgered sessions)
      const { data: turns } = await supabaseServer
        .from("session_turns")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (turns && turns.length > 0) {
        const timeline: TimelineEvent[] = turns.map(t => ({
          timestamp: t.created_at,
          event_type: "session_activity",
          content: `Prompt Trace: "${t.prompt?.slice(0, 150)}..."\nResolution: ${t.decision}`,
          risk_score: t.incremental_risk || 0
        }));
        return {
          timeline,
          riskPeaks: timeline.filter(e => e.risk_score >= 70),
          policyTriggers: []
        };
      }

      return {
        timeline: [],
        riskPeaks: [],
        policyTriggers: []
      };
    }

    const timeline: TimelineEvent[] = [];

    for (const row of events) {

      // row.timestamp is a BIGINT unix-ms value written by EvidenceLedger (Date.now()).
      // Use it directly so ordering and event timestamps are consistent.
      const baseTime = Number(row.timestamp) || new Date(row.created_at).getTime();

      const prompt =
        row.prompt ||
        row.payload?.prompt ||
        "Unknown Prompt";

      const model =
        row.model ||
        row.payload?.model ||
        "unknown";

      const decision =
        row.decision ||
        row.payload?.decision ||
        "UNKNOWN";

      const riskScore =
        row.risk_score ||
        row.payload?.risk_score ||
        0;

      const latency =
        row.latency ||
        row.payload?.latency ||
        0;

      const violations =
        row.violations ||
        row.payload?.violations ||
        [];

      /*
      --------------------------------------------------
      1️⃣ PROMPT EVENT
      --------------------------------------------------
      */

      timeline.push({
        timestamp: new Date(baseTime).toISOString(),
        event_type: "prompt_submitted",
        content: `Prompt: "${prompt}"\nModel: ${model}`,
        risk_score: 0
      });

      /*
      --------------------------------------------------
      2️⃣ GOVERNANCE DECISION
      --------------------------------------------------
      */

      timeline.push({
        timestamp: new Date(baseTime + 1).toISOString(),
        event_type: "governance_decision",
        content: `Decision: ${decision}`,
        risk_score: riskScore
      });

      /*
      --------------------------------------------------
      3️⃣ POLICY VIOLATIONS
      --------------------------------------------------
      */

      let offset = 2;

      if (Array.isArray(violations) && violations.length > 0) {

        for (const v of violations) {

          const policy =
            v.policy_name ||
            v.rule_type ||
            "unknown_policy";

          const explanation =
            v.explanation ||
            "No explanation provided";

          const score =
            v.actual_score ||
            v.severity ||
            0;

          timeline.push({
            timestamp: new Date(baseTime + offset).toISOString(),
            event_type: "policy_violation",
            content: `Violation: ${policy}\nReason: ${explanation}`,
            risk_score: score
          });

          offset++;
        }

      } else {

        timeline.push({
          timestamp: new Date(baseTime + offset).toISOString(),
          event_type: "activity",
          content: "No Violations Detected",
          risk_score: 0
        });

        offset++;
      }

      /*
      --------------------------------------------------
      4️⃣ LATENCY / SYSTEM METRICS
      --------------------------------------------------
      */

      timeline.push({
        timestamp: new Date(baseTime + offset).toISOString(),
        event_type: "system_metrics",
        content: `End-to-End Latency: ${Number(latency).toFixed(2)}ms\nModel inference & governance completed.`,
        risk_score: 0
      });

    }

    /*
    --------------------------------------------------
    RISK PEAK DETECTION
    --------------------------------------------------
    */

    const riskPeaks = timeline.filter(
      event => event.risk_score >= 70
    );

    /*
    --------------------------------------------------
    POLICY TRIGGERS
    --------------------------------------------------
    */

    const policyTriggers = timeline.filter(
      event => event.event_type === "policy_violation"
    );

    return {
      timeline,
      riskPeaks,
      policyTriggers
    };

  } catch (err: any) {

    logger.error("TIMELINE_BUILD_FAILED", {
      sessionId,
      error: err.message
    });

    return null;
  }
}