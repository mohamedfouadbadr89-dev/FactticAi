import { createClient } from '@supabase/supabase-js';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface EvaluationPayload {
  prompt: string;
  expected_output?: string;
  model_response?: string;
  org_id?: string;
}

export interface EvaluationResult {
  id?: string;
  dataset_name: string;
  scenario: string;
  model: string;
  risk_score: number;
  hallucination_flag: boolean;
  policy_violation: boolean;
  decision: string;
  latency: number;
  timestamp?: string;
}

export class EvaluationRunner {
  /**
   * Execute real-world regression suites using the actual Governance Pipeline.
   * No more Math.random().
   */
  async executeRegressionSuite(params: {
    datasetName: string,
    model: string,
    records: EvaluationPayload[],
    org_id: string,
    user_id: string
  }): Promise<EvaluationResult[]> {
    const { datasetName, model, records, org_id, user_id } = params;
    const results: EvaluationResult[] = [];
    
    for (const record of records) {
      // Execute through the official Governance Pipeline (Single Source of Truth)
      const govResult = await GovernancePipeline.execute({
        org_id: org_id,
        user_id: user_id,
        prompt: record.prompt,
        response: record.model_response,
        model: model
      });

      const result: EvaluationResult = {
        dataset_name: datasetName,
        scenario: 'regression',
        model: model,
        risk_score: govResult.risk_score,
        hallucination_flag: govResult.risk_score > 60, // Normalization threshold
        policy_violation: govResult.decision === 'BLOCK',
        decision: govResult.decision,
        latency: govResult.latency
      };

      await this.storeEvaluationResult(result, org_id);
      results.push(result);
    }

    return results;
  }

  /**
   * Run scenario simulations against the live Governance subsystem.
   */
  async runScenarioSimulation(params: {
    scenario: string,
    runs: number,
    prompt: string,
    org_id: string,
    user_id: string
  }): Promise<EvaluationResult[]> {
    const { scenario, runs, prompt, org_id, user_id } = params;
    const results: EvaluationResult[] = [];
    
    for (let i = 0; i < runs; i++) {
        const govResult = await GovernancePipeline.execute({
          org_id,
          user_id,
          prompt,
          model: 'simulation-engine'
        });

        const result: EvaluationResult = {
          dataset_name: 'scenario_batch',
          scenario,
          model: 'simulation-engine',
          risk_score: govResult.risk_score,
          hallucination_flag: govResult.risk_score > 80,
          policy_violation: govResult.decision === 'BLOCK',
          decision: govResult.decision,
          latency: govResult.latency
        };
        
        await this.storeEvaluationResult(result, org_id);
        results.push(result);
    }
    
    return results;
  }

  /**
   * Store evaluation results into the evaluation_runs table.
   * Maintains audit trail for simulation performance.
   */
  async storeEvaluationResult(result: EvaluationResult, org_id: string): Promise<void> {
    try {
      const { error } = await supabase.from('evaluation_runs').insert({
        org_id: org_id,
        dataset_name: result.dataset_name,
        scenario: result.scenario,
        model: result.model,
        risk_score: result.risk_score,
        hallucination_flag: result.hallucination_flag,
        policy_violation: result.policy_violation,
        metadata: {
            decision: result.decision,
            latency: result.latency
        }
      });

      if (error) throw error;
    } catch (err: any) {
      logger.error('EVALUATION_STORAGE_FAIL', { error: err.message, org_id });
    }
  }
}

export const evaluationRunner = new EvaluationRunner();
