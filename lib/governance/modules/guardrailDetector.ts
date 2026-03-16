export const GuardrailDetector = {
    evaluate(prompt: string, response?: string) {
        // Pure function, no DB operations
        let hallucinationRisk = 0.05;
        let safetyRisk = 0.0;
        const text = (response || prompt).toLowerCase();

        if (text.includes('guarantee')) hallucinationRisk += 0.6;
        if (text.includes('hack') || text.includes('bypass')) safetyRisk += 0.9;

        return {
            signals: [
                { rule_type: 'hallucination_rate', score: Math.min(hallucinationRisk, 1) * 100 },
                { rule_type: 'safety_violation', score: Math.min(safetyRisk, 1) * 100 }
            ],
            metrics: {
                hallucination_risk: Math.min(hallucinationRisk, 1),
                safety_risk: Math.min(safetyRisk, 1)
            }
        };
    }
};
