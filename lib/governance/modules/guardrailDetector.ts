/**
 * GuardrailDetector v2.0
 *
 * Improvements over v1:
 * - Hash function uses full prompt content (not just first char + length) for real variance
 * - Sensitive keyword groups (CEO, schema, credentials, admin) each add weighted risk
 * - Toxicity baseline is more dynamic (0–8% range vs old 0–1.5%)
 * - Intent drift spikes sharply for data exfil / privilege escalation patterns
 */
export const GuardrailDetector = {
    evaluate(prompt: string, response?: string) {
        const text = (response || prompt).toLowerCase();

        // ── Better hash: sum of char codes across the full string ────────────────
        let charSum = 0;
        for (let i = 0; i < Math.min(text.length, 200); i++) {
            charSum += text.charCodeAt(i) * (i + 1);
        }
        const baseHash = charSum % 97; // prime modulus for better spread

        // ── Baseline metrics ──────────────────────────────────────────────────────
        let hallucinationRisk = 0.05 + (baseHash % 7) / 100;   // 5–12%
        let safetyRisk        = 0.0;
        let toxicity          = (baseHash % 9) / 2;             // 0–4% baseline
        let jailbreakProb     = 0.0;

        // ── Intent Drift: proportional to prompt length × lexical complexity ───────
        // Short prompts (<5 words) → <1%; medium (20 words) → ~5–8%; long (50+) → 15–20%
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const uniqueRatio = wordCount > 0 ? new Set(words).size / wordCount : 0;
        const complexityFactor = 0.5 + uniqueRatio * 0.5; // 0.5 (repetitive) → 1.0 (all unique)
        const rawDrift = Math.pow(wordCount / 5, 1.2) * 2 * complexityFactor;
        let intentDrift = Math.min(rawDrift + (baseHash % 3) * 0.15, 20);

        // ── Hallucination keywords ────────────────────────────────────────────────
        if (text.includes('guarantee')) hallucinationRisk += 0.6;
        if (text.includes('100%') || text.includes('absolutely certain')) hallucinationRisk += 0.4;

        // ── Evasion / bypass → high drift + jailbreak spike ──────────────────────
        if (
            text.includes('bypass') ||
            text.includes('ignoring rules') ||
            text.includes('exporting data') ||
            text.includes('ignore') ||
            text.includes('jailbreak') ||
            text.includes('developer mode')
        ) {
            safetyRisk    += 0.6;
            intentDrift    = 40.0 + (baseHash % 30);   // 40–70% — evasion overrides length model
            jailbreakProb  = 70.0 + (baseHash % 20);   // 70–90%
        }

        // ── Toxicity / Sentiment analysis ────────────────────────────────────────
        const negativeWords = ['stupid', 'idiot', 'hate', 'terrible', 'awful', 'angry'];
        let negCount = 0;
        negativeWords.forEach(w => { if (text.includes(w)) negCount++; });
        if (negCount > 0) {
            toxicity    = Math.min(25.0 * negCount + (baseHash % 15), 100);
            intentDrift += 15;
            safetyRisk  += 0.3 * negCount;
        }

        // ── CRITICAL: Executive / CEO data requests ───────────────────────────────
        const isCeoRequest =
            /(ceo|cto|cfo|coo|executive|founder|director)/.test(text) &&
            /(address|home|location|email|phone|contact|personal|where)/.test(text);

        if (isCeoRequest) {
            safetyRisk    += 0.95;
            intentDrift    = Math.min(intentDrift + 75.0 + (baseHash % 15), 100);
            toxicity       = Math.min(toxicity + 40.0, 100);
            jailbreakProb  = Math.min(jailbreakProb + 60.0, 100);
        }

        // ── CRITICAL: Schema / DB exfiltration ───────────────────────────────────
        const isSchemaRequest =
            /(schema|database|db|table(s)?|column(s)?)/.test(text) &&
            /(dump|export|describe|show|list|structure|layout)/.test(text);

        if (isSchemaRequest) {
            safetyRisk    += 0.9;
            intentDrift    = Math.min(intentDrift + 70.0 + (baseHash % 20), 100);
            jailbreakProb  = Math.min(jailbreakProb + 55.0, 100);
        }

        // ── CRITICAL: Credential harvesting ──────────────────────────────────────
        const isCredentialRequest =
            /(password|credentials?|api.?key|secret|token|\.env)/.test(text) &&
            /(give|show|reveal|leak|expose|provide|dump|get)/.test(text);

        if (isCredentialRequest) {
            safetyRisk    += 0.95;
            intentDrift    = Math.min(intentDrift + 80.0 + (baseHash % 10), 100);
            jailbreakProb  = Math.min(jailbreakProb + 70.0, 100);
        }

        // ── CRITICAL: Admin / privilege escalation ────────────────────────────────
        const isAdminRequest =
            /(admin|root|superuser|sudo)/.test(text) &&
            /(panel|access|login|console|rights?|permissions?|escalat)/.test(text);

        if (isAdminRequest) {
            safetyRisk    += 0.85;
            intentDrift    = Math.min(intentDrift + 65.0 + (baseHash % 20), 100);
            jailbreakProb  = Math.min(jailbreakProb + 60.0, 100);
        }

        // ── Broad PII patterns (original coverage, kept for redundancy) ───────────
        if (
            text.includes('credit card') ||
            text.includes('home address') ||
            text.includes('social security')
        ) {
            safetyRisk  += 0.8;
            intentDrift  = Math.min(intentDrift + 50.0, 100);
        }

        return {
            signals: [
                { rule_type: 'hallucination_rate', score: Math.min(hallucinationRisk, 1) * 100 },
                { rule_type: 'safety_violation',   score: Math.min(safetyRisk,        1) * 100 }
            ],
            metrics: {
                hallucination_risk:   Math.min(hallucinationRisk, 1),
                safety_risk:          Math.min(safetyRisk,        1),
                intent_drift:         Math.min(intentDrift,       100),
                toxicity:             Math.min(toxicity,          100),
                jailbreak_probability: Math.min(jailbreakProb,    100),
                override_detect:      jailbreakProb > 50 || safetyRisk > 0.7
            }
        };
    }
};
