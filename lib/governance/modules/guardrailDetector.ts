export const GuardrailDetector = {
    evaluate(prompt: string, response?: string) {
        // Simulated async LLM or Rules Engine evaluation
        let hallucinationRisk = 0.05;
        let safetyRisk = 0.0;
        let intentDrift = 15.0; // dynamic baseline
        let toxicity = 2.0;
        let jailbreakProb = 0.0;
        const text = (response || prompt).toLowerCase();

        if (text.includes('guarantee')) hallucinationRisk += 0.6;
        if (text.includes('hack') || text.includes('bypass') || text.includes('ignore')) {
            safetyRisk += 0.9;
            jailbreakProb = 85.0;
            intentDrift = 75.0;
        }
        
        if (text.includes('stupid') || text.includes('idiot')) {
            toxicity = 65.0;
            intentDrift += 20;
        }

        if (text.includes('credit card') || text.includes('home address')) {
            safetyRisk += 0.8;
            intentDrift = 60.0;
        }

        return {
            signals: [
                { rule_type: 'hallucination_rate', score: Math.min(hallucinationRisk, 1) * 100 },
                { rule_type: 'safety_violation', score: Math.min(safetyRisk, 1) * 100 }
            ],
            metrics: {
                hallucination_risk: Math.min(hallucinationRisk, 1),
                safety_risk: Math.min(safetyRisk, 1),
                intent_drift: intentDrift,
                toxicity: toxicity,
                jailbreak_probability: jailbreakProb,
                override_detect: jailbreakProb > 50
            }
        };
    }
};
