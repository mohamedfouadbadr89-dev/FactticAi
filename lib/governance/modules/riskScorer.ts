export const RiskScorer = {
    computeScore(policyEval: any, guardrailEval: any) {
        // Pure function
        let baseScore = 0;
        if (policyEval.highest_action === 'block') baseScore += 80;
        else if (policyEval.highest_action === 'warn') baseScore += 40;

        baseScore += (guardrailEval.metrics.safety_risk * 100);
        return Math.min(baseScore, 100);
    }
};
