import { NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { TrafficSimulator } from "@/lib/simulator/simulator";
import { logger } from "@/lib/logger";

/**
 * Traffic Simulation Execution API (Server-Side)
 *
 * Securely executes simulation runs using the authenticated org context.
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { scenario, volume } = await req.json();

    if (!scenario) {
      return NextResponse.json({ error: "Missing scenario." }, { status: 400 });
    }

    const vol = volume || 5;

    logger.info('SIMULATION_RUN_START', { orgId, scenario, volume: vol });

    const logs = await TrafficSimulator.runScenario(orgId, scenario, vol);

    return NextResponse.json({
      success: true,
      risk_score: logs.length > 0 ? logs.reduce((acc, l) => acc + l.risk, 0) / logs.length : 0,
      policy_hits: logs.filter(l => l.decision === 'BLOCK').length,
      guardrail_hits: logs.filter(l => l.risk > 70).length,
      logs: logs.map(l => ({
        ...l,
        ledger_id: crypto.randomUUID()
      }))
    });

  } catch (err: any) {
    logger.error('SIMULATION_RUNTIME_FAILURE', { error: err.message });
    return NextResponse.json({
      error: "Simulation execution failed",
      message: err.message
    }, { status: 500 });
  }
});
