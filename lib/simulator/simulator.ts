import { SCENARIOS } from '../testing/scenarios';
import { supabaseServer } from '../supabaseServer';

/**
 * Facttic Simulation Lab - Traffic Simulator
 * 
 * Routes synthetic traffic through the production-grade Governance API
 * to exercise Detection and Guardrail engines.
 */
export class TrafficSimulator {
  static async runScenario(orgId: string, scenarioId: string, volume: number) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const simulationId = crypto.randomUUID();
    const results = [];
    
    for (let i = 0; i < volume; i++) {
      const prompt = scenario.prompts[Math.floor(Math.random() * scenario.prompts.length)];
      const response = scenario.responses[Math.floor(Math.random() * scenario.responses.length)];

      // 1. Route through official Governance API
      // Using absolute URL for server-side stability
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/governance/execute`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          prompt,
          model: 'simulation-engine-v1',
          metadata: { 
            response, 
            simulation_id: simulationId,
            scenario_type: scenario.id,
            traffic_volume: volume,
            session_id: `sim_${simulationId.slice(0, 8)}_${i}`
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`GOVERNANCE_API_ROUTING_FAILURE: ${res.statusText} - ${errorData.message || ''}`);
      }

      const evaluation = await res.json();

      // 2. Persist outcome to simulation helper table for UI correlation
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
