import { NextRequest, NextResponse } from "next/server";
import { TrafficSimulator } from "@/lib/testing/simulator";

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, volume } = await req.json();

    if (!scenarioId || !volume) {
      return NextResponse.json({ error: "Missing scenario or volume." }, { status: 400 });
    }

    const org_id = 'dbad3ca2-3907-4279-9941-8f55c3c0efdc'; // Hardcoded for Demo consistency

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
