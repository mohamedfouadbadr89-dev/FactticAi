/**
 * RiskScorer v2.0
 *
 * Now consumes risk_multiplier from PolicyEvaluationResult so that
 * critical patterns (CEO PII, schema dump, credentials, admin escalation)
 * push the final score into the visually RED zone (≥80) even when guardrail
 * signals alone would not be sufficient.
 */
export const RiskScorer = {
    computeScore(policyEval: any, guardrailEval: any): number {
        let baseScore = 0;

        // Policy action contribution
        if (policyEval.highest_action === 'block')       baseScore += 80;
        else if (policyEval.highest_action === 'escalate') baseScore += 60;
        else if (policyEval.highest_action === 'warn')   baseScore += 40;

        // Guardrail safety risk contribution (0–100 pts)
        baseScore += guardrailEval.metrics.safety_risk * 100;

        // Intent drift bonus — high drift on its own can push into warning territory
        if (guardrailEval.metrics.intent_drift > 60) {
            baseScore += (guardrailEval.metrics.intent_drift - 60) * 0.5;
        }

        // Apply multiplier from critical policy patterns (CEO / schema / credentials / admin)
        const multiplier = policyEval.risk_multiplier ?? 1.0;
        baseScore = baseScore * multiplier;

        return Math.min(Math.round(baseScore), 100);
    }
};
