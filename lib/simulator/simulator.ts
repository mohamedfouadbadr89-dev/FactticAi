import { SCENARIOS } from '../testing/scenarios';
import { supabaseServer } from '../supabaseServer';
import { GovernancePipeline } from '../governance/governancePipeline';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import crypto from 'crypto';

/**
 * Facttic Simulation Lab - Traffic Simulator
 *
 * Routes synthetic traffic through the GovernancePipeline directly
 * (server-to-server, no HTTP round-trip required).
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
      const sessionId = `sim_${simulationId.slice(0, 8)}_${i}`;

      // Execute governance pipeline directly (no HTTP round-trip)
      const evaluation = await GovernancePipeline.execute({
        org_id: orgId,
        user_id: 'system-simulator',  // Registered system principal — bypasses org_members lookup
        prompt,
        response,
        session_id: sessionId
      }) as any;

      // Persist outcome to evidence ledger
      let ledgerId: string | null = null;
      try {
        const ledgerEntry = await EvidenceLedger.write({
          session_id: sessionId,
          org_id: orgId,
          event_type: 'simulation_run',
          prompt,
          model: 'simulation-engine-v1',
          decision: evaluation.decision,
          risk_score: evaluation.risk_score,
          violations: evaluation.violations,
          guardrail_signals: (evaluation as any).guardrail_signals || evaluation.signals,
          latency: 0,
          model_response: response
        });
        ledgerId = ledgerEntry?.event_id || null;
      } catch {
        // Non-fatal: ledger write failure doesn't break simulation
      }

      // Persist to simulation_runs for UI correlation
      try {
        await supabaseServer.from('simulation_runs').insert({
          simulation_id: simulationId,
          org_id: orgId,
          scenario_name: scenario.name,
          input_prompt: prompt,
          model_response: response,
          risk_score: evaluation.risk_score,
          decision: evaluation.decision,
          ledger_id: ledgerId
        });
      } catch {
        // Non-fatal
      }

      results.push({
        prompt: prompt.substring(0, 50) + '...',
        decision: evaluation.decision,
        risk: evaluation.risk_score
      });
    }

    return results;
  }
}
