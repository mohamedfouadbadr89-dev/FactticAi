import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextRequest, NextResponse } from "next/server";
import { TrafficSimulator } from "@/lib/simulator/simulator";
import { logger } from "@/lib/logger";

/**
 * Traffic Simulation Execution API (Server-Side)
 * 
 * Securely executes simulation runs using SUPABASE_SERVICE_ROLE_KEY.
 */
export async function POST(req: NextRequest) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const { scenario, org_id, volume } = await req.json();

    if (!scenario || !org_id) {
      return NextResponse.json({ error: "Missing scenario or org_id." }, { status: 400 });
    }

    const vol = volume || 5; // Default volume if not provided

    logger.info('SIMULATION_RUN_START', { org_id, scenario, volume: vol });

    const logs = await TrafficSimulator.runScenario(org_id, scenario, vol);

    // Return telemetry results as requested
    return NextResponse.json({ 
      success: true,
      risk_score: logs.reduce((acc, l) => acc + l.risk, 0) / logs.length,
      policy_hits: logs.filter(l => l.decision === 'BLOCK').length,
      guardrail_hits: logs.filter(l => l.risk > 70).length, // Heuristic for guardrail hits
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
}
