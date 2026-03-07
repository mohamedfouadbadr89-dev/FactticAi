import { NextRequest, NextResponse } from "next/server";
import { TrafficSimulator } from "@/lib/testing/simulator";

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, volume, org_id } = await req.json();

    if (!scenarioId || !volume || !org_id) {
      return NextResponse.json({ error: "Missing scenario, volume or org_id." }, { status: 400 });
    }

    const logs = await TrafficSimulator.runScenario(org_id, scenarioId, volume);

    return NextResponse.json({ 
      success: true, 
      count: logs.length,
      logs 
    });

  } catch (err: any) {
    console.error('SIMULATION_API_ERROR:', err);
    return NextResponse.json({ error: "Simulation failed." }, { status: 500 });
  }
}
