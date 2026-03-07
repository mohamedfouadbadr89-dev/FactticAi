import { GovernancePipeline } from '../governancePipeline';
import { supabaseServer } from '../supabaseServer';
import { SCENARIOS } from './scenarios';

export class TrafficSimulator {
  static async runScenario(orgId: string, scenarioId: string, volume: number) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const simulationId = crypto.randomUUID();
    const results = [];
    
    for (let i = 0; i < volume; i++) {
      const prompt = scenario.prompts[Math.floor(Math.random() * scenario.prompts.length)];
      const response = scenario.responses[Math.floor(Math.random() * scenario.responses.length)];

      // 1. Execute through Control API Layer
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/governance/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          prompt,
          simulation_mode: true,
          metadata: { 
            response, 
            simulation_id: simulationId,
            scenario_type: scenario.id,
            traffic_volume: volume,
            session_id: `sim_${simulationId.slice(0, 8)}_${i}`
          }
        })
      });

      if (!res.ok) throw new Error('Control API execution failed.');
      const evaluation = await res.json();

      // 2. Persist simulation outcome to helper table for auditing
      await supabaseServer.from('simulation_runs').insert({
        simulation_id: simulationId,
        scenario_name: scenario.name,
        input_prompt: prompt,
        model_response: response,
        risk_score: evaluation.risk_score,
        decision: evaluation.decision,
        ledger_id: evaluation.ledger_id
      });

      results.push({
        prompt: prompt.substring(0, 50) + '...',
        decision: evaluation.decision,
        risk: evaluation.risk_score
      });
    }

    return results;
  }
}
