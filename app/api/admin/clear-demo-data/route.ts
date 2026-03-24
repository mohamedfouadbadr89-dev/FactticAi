import { NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/clear-demo-data
 * Reset all organizational governance data for demos.
 * Restricted to owners only.
 */
export const POST = withAuth(async (req: Request, { userId, orgId }: AuthContext) => {
  try {
    // 1. Verify Role (must be 'owner')
    const { data: membership, error: mError } = await supabaseServer
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .single();

    if (mError || !membership || membership.role !== "owner") {
      logger.warn("CLEAN_DATA_ACCESS_DENIED", { userId, orgId });
      return NextResponse.json({ error: "UNAUTHORIZED_ROLE_REQUIRED" }, { status: 403 });
    }

    // 2. Clear Tables (Sequential Deletions)
    const tables = [
      "runtime_intercepts",
      "audit_logs",
      "governance_alerts",
      "drift_alerts",
      "governance_root_cause_reports",
      "incidents",
      "agent_sessions",
      "agent_steps",
      "governance_predictions",
      "drift_metrics"
    ];

    const results: Record<string, number> = {};

    for (const table of tables) {
      const { data, count, error } = await supabaseServer
        .from(table)
        .delete({ count: "exact" })
        .eq("org_id", orgId);
      
      if (error) {
        logger.error(`CLEAR_DATA_FAILED_FOR_${table.toUpperCase()}`, { orgId, error: error.message });
      } else {
        results[table] = count || 0;
      }
    }

    // 3. Log the action to audit_logs (AFTER clearing)
    await supabaseServer.from("audit_logs").insert({
      org_id: orgId,
      actor_id: userId,
      action: "DEMO_DATA_CLEARED",
      metadata: { deleted_counts: results, triggered_at: new Date().toISOString() }
    });

    return NextResponse.json({
      success: true,
      deleted: results,
      total_deleted: Object.values(results).reduce((a, b) => a + b, 0)
    });

  } catch (error: any) {
    logger.error("CLEAR_DATA_API_ERROR", { error: error.message });
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
});
