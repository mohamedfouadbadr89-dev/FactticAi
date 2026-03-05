import { NextRequest, NextResponse } from 'next/server';
import { ScenarioEngine } from '@/lib/simulation/scenarioEngine';
import { logger } from '@/lib/logger';

/**
 * Simulation Run API
 * 
 * Triggers a synthetic scenario run to test AI governance behavior.
 */
export async function POST(req: NextRequest) {
  try {
    const { scenario } = await req.json();

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario name is required' }, { status: 400 });
    }

    const result = await ScenarioEngine.runScenario(scenario);

    if (!result) {
      return NextResponse.json({ error: 'Simulation run failed' }, { status: 500 });
    }

    return NextResponse.json({ result }, { status: 200 });

  } catch (err: any) {
    logger.error('SIMULATION_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

/**
 * Get Available Scenarios
 */
export async function GET() {
  const scenarios = ScenarioEngine.getAvailableScenarios();
  return NextResponse.json({ scenarios });
}
