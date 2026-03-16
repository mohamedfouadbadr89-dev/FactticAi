import { NextResponse } from 'next/server';
import { evaluationRunner } from '@/lib/evaluation/evaluationRunner';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenario, runs } = body;

    if (!scenario || !runs) {
      return NextResponse.json({ error: 'Missing scenario or runs parameter' }, { status: 400 });
    }

    // Run scenario batches
    const results = await evaluationRunner.runScenarioSimulation(scenario, runs);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
