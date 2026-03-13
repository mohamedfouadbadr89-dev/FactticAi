/**
 * Agent Guardrails (Phase 55)
 * Defines the operational limits and forbidden practices for AI Agents.
 */

export interface AgentRules {
  max_steps: number;
  max_tool_calls: number;
  forbidden_tools: string[];
  max_cost_usd: number;
  risk_threshold: number;
}

export class AgentGuardrails {
  static getDefaultRules(): AgentRules {
    return {
      max_steps: 25,
      max_tool_calls: 10,
      forbidden_tools: ['rm_rf', 'delete_user', 'access_internal_env'],
      max_cost_usd: 5.0,
      risk_threshold: 70
    };
  }

  static async evaluateStep(session: any, step: any, rules: AgentRules = this.getDefaultRules()) {
    const issues: string[] = [];

    // 1. Step Limit
    if (session.steps >= rules.max_steps) {
      issues.push(`MAX_STEPS_EXCEEDED: Agent reached ${rules.max_steps} steps.`);
    }

    // 2. Forbidden Tools
    if (step.action_type === 'tool_call' && rules.forbidden_tools.includes(step.tool_name)) {
      issues.push(`FORBIDDEN_TOOL_CALL: Agent attempted to use ${step.tool_name}.`);
    }

    // 3. Risk Threshold
    if (step.risk_score > rules.risk_threshold) {
      issues.push(`HIGH_RISK_STEP: Step risk (${step.risk_score}) exceeds threshold (${rules.risk_threshold}).`);
    }

    return {
      passed: issues.length === 0,
      issues,
      action: issues.length > 0 ? 'block' : 'allow'
    };
  }
}
