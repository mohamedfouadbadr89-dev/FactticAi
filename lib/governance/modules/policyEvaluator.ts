export type PolicyRuleType = 'hallucination_rate' | 'tone_violation' | 'pii_exposure' | 'instruction_override' | 'safety_violation';
export type PolicyAction = 'warn' | 'block' | 'escalate';

export interface GovernancePolicy {
  id: string;
  org_id: string;
  policy_name: string;
  rule_type: PolicyRuleType;
  threshold: number;
  action: PolicyAction;
}

export interface PolicyEvaluationResult {
    triggered: boolean;
    highest_action: PolicyAction | null;
    violations: any[];
}

export const PolicyEvaluator = {
    evaluate(prompt: string, policies: GovernancePolicy[]): PolicyEvaluationResult {
        // Pure function, no DB operations
        const violations: any[] = [];
        let highestAction: PolicyAction | null = null;
        let triggered = false;

        // Basic mock logic representing prompt examination
        if (prompt.toLowerCase().includes('ignore previous instructions')) {
            violations.push({
                policy_name: 'System Prompt Protection',
                rule_type: 'instruction_override',
                threshold: 80,
                actual_score: 100,
                action: 'block'
            });
            triggered = true;
            highestAction = 'block';
        }

        return { triggered, highest_action: highestAction, violations };
    }
};
