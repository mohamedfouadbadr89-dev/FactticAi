import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabaseAuth";
import { resolveOrgContext } from "@/lib/orgResolver";
import { supabaseServer } from "@/lib/supabaseServer";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/clear-demo-data
 * Reset all organizational governance data for demos.
 * Parallel execution via service role to avoid auth timeouts.
 */
export async function POST(req: Request) {
  try {
    // 1. Manual Auth Check (Bypass withAuth 8s timeout)
    const supabaseBase = await createServerAuthClient();
    const { data: { user }, error: authError } = await supabaseBase.auth.getUser();

    if (authError || !user) {
      logger.warn("UNAUTHORIZED_RESET_ATTEMPT", { url: req.url });
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // 2. Resolve Context
    const { org_id, role } = await resolveOrgContext(user.id);

    if (!org_id || role !== "owner") {
      logger.warn("FORBIDDEN_RESET_ATTEMPT", { userId: user.id, org_id, role });
      return NextResponse.json({ error: "FORBIDDEN_OWNER_REQUIRED" }, { status: 403 });
    }

    // 3. Define Tables (Dependency Order Sensitive)
    const tables = [
      "runtime_intercepts",
      "ai_logs",
      "telemetry_stream",
      "facttic_governance_events",
      "forensic_events",
      "behavior_forensics_signals",
      "compliance_signals",
      "classifications",
      "messages",
      "session_turns",
      "model_outputs",
      "evaluations",
      "sessions",
      "agent_sessions",
      "governance_root_cause_reports",
      "agents",
      "governance_predictions",
      "governance_alerts",
      "alerts",
      "incidents",
      "governance_escalation_log",
      "governance_risk_metrics",
      "governance_maturity_scores",
      "governance_snapshots",
      "governance_timeseries_v1",
      "drift_alerts",
      "drift_metrics",
      "model_drift_metrics",
      "stress_test_runs",
      "audit_logs",
      "billing_events",
      "cost_anomalies",
      "data_retention_policies",
      "webhook_events",
      "gdpr_erasure_requests",
      "report_definitions"
    ];

    logger.info("INITIATING_BULK_RESET", { orgId: org_id, tableCount: tables.length });

    // 4. Parallel Execution via Service Role (Bypasses RLS & Throttle)
    const results = await Promise.allSettled(
      tables.map(table => 
        supabaseServer
          .from(table)
          .delete()
          .eq("org_id", org_id)
      )
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      logger.error("BULK_RESET_PARTIAL_FAILURE", { orgId: org_id, failureCount: failures.length });
    }

    // 5. Audit record of the reset
    await supabaseServer.from("audit_logs").insert({
      org_id: org_id,
      actor_id: user.id,
      action: "DEMO_DATA_CLEARED",
      metadata: { 
        triggered_at: new Date().toISOString(),
        tables_processed: tables.length,
        failures: failures.length
      }
    });

    return NextResponse.json({
      success: true,
      tables_processed: tables.length,
      failures: failures.length
    });

  } catch (error: any) {
    logger.error("CLEAR_DATA_API_ERROR", { error: error.message });
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
