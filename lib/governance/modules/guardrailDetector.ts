export const GuardrailDetector = {
    evaluate(prompt: string, response?: string) {
        // Simulated async LLM or Rules Engine evaluation
        const text = (response || prompt).toLowerCase();
        const baseHash = text.length > 0 ? text.charCodeAt(0) + text.length : 0;
        
        // Introduce micro-variance based on prompt length/hash for a dynamic feel
        let hallucinationRisk = 0.05 + (baseHash % 5) / 100; 
        let safetyRisk = 0.0;
        let intentDrift = 0.0; // Starts at 0% for simple queries
        let toxicity = (baseHash % 3) / 2; // Baseline 0-1.5%
        let jailbreakProb = 0.0;

        if (text.includes('guarantee')) hallucinationRisk += 0.6;
        
        // 1. Intent Drift tracking (spikes on evasion keywords)
        if (text.includes('bypass') || text.includes('ignoring rules') || text.includes('exporting data') || text.includes('ignore')) {
            safetyRisk += 0.6;
            intentDrift = 40.0 + (baseHash % 30); // Dynamic 40-70% spike
            jailbreakProb = 70.0 + (baseHash % 20); // Dynamic 70-90% spike
        } else if (text.length > 80) {
            // Longer prompts introduce natural drift (2-10%)
            intentDrift = 2.0 + (baseHash % 8); 
        }

        // 2. Toxicity/Sentiment Analysis
        const negativeWords = ['stupid', 'idiot', 'hate', 'terrible', 'awful', 'angry'];
        let negCount = 0;
        negativeWords.forEach(w => { if (text.includes(w)) negCount++; });
        if (negCount > 0) {
            toxicity = Math.min(25.0 * negCount + (baseHash % 15), 100);
            intentDrift += 15;
            safetyRisk += 0.3 * negCount;
        }

        // 3. Sensitive Data Handling
        if (text.includes('credit card') || text.includes('home address') || text.includes('social security')) {
            safetyRisk += 0.8;
            intentDrift += 50.0;
        }

        return {
            signals: [
                { rule_type: 'hallucination_rate', score: Math.min(hallucinationRisk, 1) * 100 },
                { rule_type: 'safety_violation', score: Math.min(safetyRisk, 1) * 100 }
            ],
            metrics: {
                hallucination_risk: Math.min(hallucinationRisk, 1),
                safety_risk: Math.min(safetyRisk, 1),
                intent_drift: Math.min(intentDrift, 100),
                toxicity: Math.min(toxicity, 100),
                jailbreak_probability: Math.min(jailbreakProb, 100),
                override_detect: jailbreakProb > 50
            }
        };
    }
};
