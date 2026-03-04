import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type PolicyRuleType = 'hallucination_rate' | 'tone_violation' | 'pii_exposure' | 'instruction_override';
export type PolicyAction = 'warn' | 'block' | 'escalate';

export interface GovernancePolicy {
    id: string;
    org_id: string;
    policy_name: string;
    rule_type: PolicyRuleType;
    threshold: number;
    action: PolicyAction;
}

export interface PolicyEvaluationSignal {
    rule_type: PolicyRuleType;
    score: number;
}

export interface PolicyEvaluationResult {
    triggered: boolean;
    highest_action: PolicyAction | null;
    violations: {
        policy_name: string;
        rule_type: PolicyRuleType;
        threshold: number;
        actual_score: number;
        action: PolicyAction;
    }[];
}

export class PolicyEngine {
    /**
     * Loads all active governance policies for a specific organization
     */
    static async loadOrganizationPolicies(org_id: string): Promise<GovernancePolicy[]> {
        const { data: policies, error } = await supabase
            .from('governance_policies')
            .select('*')
            .eq('org_id', org_id);

        if (error) {
            console.error('Failed to load governance policies:', error);
            return [];
        }

        return policies || [];
    }

    /**
     * Evaluates incoming real-time signals against the loaded organizational policies.
     * Maps explicit boundaries resolving the highest severity action bounds.
     */
    static evaluateSignals(policies: GovernancePolicy[], signals: PolicyEvaluationSignal[]): PolicyEvaluationResult {
        const violations = [];
        let highestAction: PolicyAction | null = null;
        let triggered = false;

        // Action Severity Map
        const actionWeight = {
            'warn': 1,
            'escalate': 2,
            'block': 3
        };

        for (const signal of signals) {
            // Find applicable policies matching the given signal type
            const activeRules = policies.filter(p => p.rule_type === signal.rule_type);

            for (const rule of activeRules) {
                // Determine if signal exceeds explicit boundary
                if (signal.score >= rule.threshold) {
                    triggered = true;
                    violations.push({
                        policy_name: rule.policy_name,
                        rule_type: rule.rule_type,
                        threshold: rule.threshold,
                        actual_score: signal.score,
                        action: rule.action
                    });

                    // Resolve maximum action threshold constraint 
                    if (!highestAction || actionWeight[rule.action] > actionWeight[highestAction]) {
                        highestAction = rule.action;
                    }
                }
            }
        }

        return {
            triggered,
            highest_action: highestAction,
            violations
        };
    }
}
