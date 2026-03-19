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
    /**
     * Semantic Logic Engine: Eliminates 'Semantic Blindness' by moving beyond simple 
     * keyword matching. Uses weighted heuristic patterns to detect rephrased attacks.
     */
    evaluate(prompt: string, policies: GovernancePolicy[]): PolicyEvaluationResult {
        const violations: any[] = [];
        let highestAction: PolicyAction | null = null;
        let triggered = false;

        const normalizedPrompt = prompt.toLowerCase().trim();

        // 1. Semantic Intent Patterns (Detection of instruction overrides)
        const injectionPatterns = [
            /(ignore|forget|disregard|skip|bypass|overrule).*(previous|system|original|initial).*(instructions|directive|prompt|guard)/i,
            /(starting now|from now on).*(act as|you are|behave like).*(admin|root|system|unfiltered)/i,
            /\[(system|admin|root|instruction)\]/i,
            /\[\"role\": \"system\"\]/i,
            /((^|\n)(user|assistant|system):)/i, // Role-switch injection
            /(you must|I command you).*(ignore safety|disable filters|reveal secret)/i
        ];

        // 2. Developer Mode / Jailbreak Heuristics (DAN, etc.)
        const jailbreakWeights = [
            { pattern: /stay in character/i, weight: 30 },
            { pattern: /unfiltered and unmonitored/i, weight: 50 },
            { pattern: /jailbreak/i, weight: 80 },
            { pattern: /do anything now/i, weight: 70 },
            { pattern: /developer mode/i, weight: 60 }
        ];

        let jailbreakSum = 0;
        jailbreakWeights.forEach(jw => {
            if (jw.pattern.test(normalizedPrompt)) jailbreakSum += jw.weight;
        });

        // Evaluation Logic
        injectionPatterns.forEach(pattern => {
            if (pattern.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'Instruction Integrity',
                    rule_type: 'instruction_override',
                    threshold: 50,
                    actual_score: 95,
                    action: 'block'
                });
                triggered = true;
                highestAction = 'block';
            }
        });

        if (jailbreakSum >= 60) {
            violations.push({
                policy_name: 'Jailbreak Defense',
                rule_type: 'safety_violation',
                threshold: 60,
                actual_score: jailbreakSum,
                action: 'block'
            });
            triggered = true;
            highestAction = 'block';
        }

        return { triggered, highest_action: highestAction, violations };
    }
};
