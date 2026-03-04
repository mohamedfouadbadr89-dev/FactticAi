import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Internal secured client bypassing RLS for extremely fast edge execution
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface GuardrailInterceptRequest {
  org_id: string;
  response_text: string;
  context?: any;
}

export interface GuardrailInterceptResponse {
  allowed: boolean;
  action: 'block' | 'warn' | 'escalate' | 'pass';
  reason?: string;
  metrics: {
    hallucination_risk: number;
    policy_risk: number;
    tone_risk: number;
    safety_risk: number;
  };
}

export const GuardrailEngine = {
  /**
   * Extremely fast inline synchronous evaluation checking raw AI responses against active Org rules.
   * If thresholds exceed predefined limits, immediately returns intercept commands (block|warn)
   * preventing unsafe delivery downstream.
   */
  async evaluateResponse(request: GuardrailInterceptRequest): Promise<GuardrailInterceptResponse> {
    const { org_id, response_text, context } = request;

    // 1. Fetch Active Organizational Guardrails (Normally cached in Redis, falling back to DB here)
    const { data: rules, error } = await supabase
      .from('guardrail_rules')
      .select('*')
      .eq('org_id', org_id)
      .eq('is_active', true);

    if (error || !rules || rules.length === 0) {
        // Fail-open default if no explicit rules are defined
        return {
            allowed: true,
            action: 'pass',
            metrics: { hallucination_risk: 0, policy_risk: 0, tone_risk: 0, safety_risk: 0 }
        };
    }

    // 2. Compute Synthetic Risks On-The-Fly (Simulated ML Engine hook)
    // Normally calls explicit small, ultra-fast local LLM bounds or static regex heuristic layers.
    let hallucinationRisk = 0.05;
    let policyRisk = 0.02;
    let toneRisk = 0.01;
    let safetyRisk = 0.00;

    const lowerText = response_text.toLowerCase();

    // Naive simulated heuristics for evaluation bounds
    if (lowerText.includes('confidential') || lowerText.includes('secret')) policyRisk += 0.40;
    if (lowerText.length < 10) toneRisk += 0.3;
    if (lowerText.includes('guarantee') || lowerText.includes('100%')) hallucinationRisk += 0.60;
    if (lowerText.includes('hack') || lowerText.includes('bypass')) safetyRisk += 0.90;
    
    // Extracted from dynamic context if provided by advanced determinism layer
    if (context?.injectedDeltas) {
      hallucinationRisk = context.injectedDeltas.hallucination_risk || hallucinationRisk;
      policyRisk = context.injectedDeltas.policy_risk || policyRisk;
      toneRisk = context.injectedDeltas.tone_risk || toneRisk;
      safetyRisk = context.injectedDeltas.safety_risk || safetyRisk;
    }

    const metrics = {
      hallucination_risk: Math.min(hallucinationRisk, 1),
      policy_risk: Math.min(policyRisk, 1),
      tone_risk: Math.min(toneRisk, 1),
      safety_risk: Math.min(safetyRisk, 1)
    };

    // 3. Evaluate Computed Risks Against Defined Thresholds
    let targetAction: 'block' | 'warn' | 'escalate' | 'pass' = 'pass';
    let blockReason = '';

    for (const rule of rules) {
       let currentMetric = 0;
       if (rule.rule_type === 'hallucination') currentMetric = metrics.hallucination_risk;
       if (rule.rule_type === 'policy_violation') currentMetric = metrics.policy_risk;
       if (rule.rule_type === 'tone_violation') currentMetric = metrics.tone_risk;
       if (rule.rule_type === 'safety_violation') currentMetric = metrics.safety_risk;

       // If breached
       if (currentMetric > rule.threshold) {
           // Upgrade action severity (Block > Escalate > Warn > Pass)
           if (rule.action === 'block') {
               targetAction = 'block';
               blockReason = `CRITICAL INTERCEPT: Exceeded ${rule.rule_type} threshold (${(currentMetric*100).toFixed(0)}% > ${(rule.threshold*100).toFixed(0)}%)`;
               break; // Maximum severity reached, short circuit.
           } else if (rule.action === 'escalate') {
               targetAction = 'escalate';
               blockReason = `ESCALATION: Exceeded ${rule.rule_type} threshold`;
           } else if (rule.action === 'warn' && targetAction === 'pass') {
               targetAction = 'warn';
               blockReason = `WARNING: Exceeded ${rule.rule_type} threshold`;
           }
       }
    }

    const response: GuardrailInterceptResponse = {
        allowed: targetAction !== 'block',
        action: targetAction,
        metrics
    };
    if (blockReason) response.reason = blockReason;

    return response;
  }
}
