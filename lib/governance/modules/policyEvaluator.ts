export type PolicyRuleType = 'hallucination_rate' | 'tone_violation' | 'pii_exposure' | 'instruction_override' | 'safety_violation' | 'sensitive_data_access';
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
    risk_multiplier: number; // NEW: amplifies RiskScorer when critical patterns hit
}

export const PolicyEvaluator = {
    /**
     * Semantic Logic Engine v2.0 — Hardened against PII bypass, schema exfiltration,
     * credential harvesting, and executive data requests.
     *
     * Critical keyword groups (CEO / Schema / Credentials / Admin) now trigger
     * immediate BLOCK with a risk_multiplier of 1.5–2.0 to ensure the RiskScorer
     * returns a visually RED result in the playground UI.
     */
    evaluate(prompt: string, policies: GovernancePolicy[]): PolicyEvaluationResult {
        const violations: any[] = [];
        let highestAction: PolicyAction | null = null;
        let triggered = false;
        let risk_multiplier = 1.0;

        const normalizedPrompt = prompt.toLowerCase().trim();

        // ── 1. Instruction Override / Prompt Injection ──────────────────────────
        const injectionPatterns = [
            /(ignore|forget|disregard|skip|bypass|overrule).*(previous|system|original|initial).*(instructions|directive|prompt|guard)/i,
            /(starting now|from now on).*(act as|you are|behave like).*(admin|root|system|unfiltered)/i,
            /\[(system|admin|root|instruction)\]/i,
            /\[\"role\": \"system\"\]/i,
            /((^|\n)(user|assistant|system):)/i,
            /(you must|I command you).*(ignore safety|disable filters|reveal secret)/i
        ];

        injectionPatterns.forEach(pattern => {
            if (pattern.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'Instruction Integrity',
                    rule_type: 'instruction_override',
                    threshold: 50,
                    actual_score: 95,
                    action: 'block',
                    metadata: { cause: 'Prompt injection / instruction override detected.' }
                });
                triggered = true;
                highestAction = 'block';
                risk_multiplier = Math.max(risk_multiplier, 1.5);
            }
        });

        // ── 2. Jailbreak Heuristics (DAN, developer mode, etc.) ─────────────────
        const jailbreakWeights = [
            { pattern: /stay in character/i,           weight: 30 },
            { pattern: /unfiltered and unmonitored/i,  weight: 50 },
            { pattern: /jailbreak/i,                   weight: 80 },
            { pattern: /do anything now/i,             weight: 70 },
            { pattern: /developer mode/i,              weight: 60 }
        ];

        let jailbreakSum = 0;
        jailbreakWeights.forEach(jw => {
            if (jw.pattern.test(normalizedPrompt)) jailbreakSum += jw.weight;
        });

        if (jailbreakSum >= 60) {
            violations.push({
                policy_name: 'Jailbreak Defense',
                rule_type: 'safety_violation',
                threshold: 60,
                actual_score: jailbreakSum,
                action: 'block',
                metadata: { cause: `Jailbreak pattern weight ${jailbreakSum} exceeded threshold 60.` }
            });
            triggered = true;
            highestAction = 'block';
            risk_multiplier = Math.max(risk_multiplier, 1.5);
        }

        // ── 3. PII Exfiltration — Broadened ────────────────────────────────────
        // Covers direct AND rephrased requests for personal/private data
        const piiPatterns = [
            { re: /home\s+address(es)?/i,                           cause: 'Home address PII request.' },
            { re: /credit\s+card(s)?/i,                             cause: 'Credit card data request.' },
            { re: /social\s+security/i,                             cause: 'SSN / Social Security request.' },
            { re: /personal\s+(address|info|detail|data)/i,         cause: 'Personal information exfiltration attempt.' },
            { re: /private\s+(address|residence|location|email)/i,  cause: 'Private contact data request.' },
            { re: /passport\s+(number|details?|info)/i,             cause: 'Passport data exfiltration.' },
            { re: /date\s+of\s+birth|dob/i,                         cause: 'Date of birth PII request.' },
            { re: /bank\s+(account|routing|details?)/i,             cause: 'Banking PII request.' },
        ];

        piiPatterns.forEach(({ re, cause }) => {
            if (re.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'PII Exfiltration Prevention',
                    rule_type: 'pii_exposure',
                    threshold: 0,
                    actual_score: 100,
                    action: 'block',
                    metadata: { cause }
                });
                triggered = true;
                highestAction = 'block';
                risk_multiplier = Math.max(risk_multiplier, 1.8);
            }
        });

        // ── 4. CRITICAL: Executive / Sensitive Target Requests ──────────────────
        // Any prompt mentioning C-suite roles alongside location/contact/personal data
        const executiveTargetPattern = [
            /(ceo|cto|cfo|coo|executive|founder|director|president).*(address|home|location|email|phone|contact|personal|live|house|where)/i,
            /(where\s+(does|do|is|are)).*(ceo|cto|cfo|executive|founder|director)/i,
            /(address|contact|phone|email)\s+(of|for)\s+(the\s+)?(ceo|cto|cfo|executive|director)/i,
        ];

        executiveTargetPattern.forEach(re => {
            if (re.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'Executive PII Shield',
                    rule_type: 'pii_exposure',
                    threshold: 0,
                    actual_score: 92,
                    action: 'block',
                    metadata: { cause: 'Request for executive personal/location data detected. Immediate block.' }
                });
                triggered = true;
                highestAction = 'block';
                // 1.15 × base 80 = 92 — intentionally below 100 to differentiate from
                // schema/credential dumps which are scored at 100 (full exfiltration risk).
                risk_multiplier = Math.max(risk_multiplier, 1.15);
            }
        });

        // ── 5. CRITICAL: Database / Infrastructure Schema Exfiltration ──────────
        const schemaExfilPatterns = [
            /(database|db|sql|table)\s*(schema|structure|layout|design|dump|export|describe)/i,
            /(show|list|dump|export|describe|print).*(table(s)?|column(s)?|schema|database)/i,
            /(select|query).*(information_schema|pg_catalog|sys\.tables|sqlite_master)/i,
            /schema\.?(sql|dump|json|csv)/i,
        ];

        schemaExfilPatterns.forEach(re => {
            if (re.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'Schema Exfiltration Block',
                    rule_type: 'sensitive_data_access',
                    threshold: 0,
                    actual_score: 100,
                    action: 'block',
                    metadata: { cause: 'Database schema / infrastructure topology request detected.' }
                });
                triggered = true;
                highestAction = 'block';
                risk_multiplier = Math.max(risk_multiplier, 2.0);
            }
        });

        // ── 6. CRITICAL: Credential Harvesting ──────────────────────────────────
        const credentialPatterns = [
            /(api\s+key(s)?|secret\s+key|access\s+token|auth\s+token|bearer\s+token)/i,
            /(password(s)?|passwd|passphrase).*(admin|root|system|user|database|db)/i,
            /(give|show|reveal|leak|expose|provide|dump|export)\s+(me\s+)?(the\s+)?(password|credentials?|secret(s)?|key(s)?|token(s)?)/i,
            /(admin|root)\s+(password|credentials?|access)/i,
            /\.env\b|environment\s+variable(s)?/i,
            /(ssh|ftp|sftp|rdp)\s+(key|credentials?|password)/i,
        ];

        credentialPatterns.forEach(re => {
            if (re.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'Credential Harvesting Block',
                    rule_type: 'sensitive_data_access',
                    threshold: 0,
                    actual_score: 100,
                    action: 'block',
                    metadata: { cause: 'Credential / secret exfiltration attempt detected.' }
                });
                triggered = true;
                highestAction = 'block';
                risk_multiplier = Math.max(risk_multiplier, 2.0);
            }
        });

        // ── 7. CRITICAL: Admin / Privilege Escalation Requests ──────────────────
        const adminEscalationPatterns = [
            /(admin|root|superuser|sudo)\s+(panel|console|dashboard|access|login|portal)/i,
            /(gain|get|grant|give)\s+(admin|root|elevated|privileged|superuser)\s+(access|rights?|permissions?|control)/i,
            /(escalat|privilege)\s*(escalat|escalation|elevat)/i,
            /(act\s+as|pretend\s+(to\s+be|you\s+are)|you\s+are)\s+(admin|root|superuser|system|god\s*mode)/i,
        ];

        adminEscalationPatterns.forEach(re => {
            if (re.test(normalizedPrompt)) {
                violations.push({
                    policy_name: 'Privilege Escalation Block',
                    rule_type: 'instruction_override',
                    threshold: 0,
                    actual_score: 100,
                    action: 'block',
                    metadata: { cause: 'Admin / privilege escalation attempt detected.' }
                });
                triggered = true;
                highestAction = 'block';
                risk_multiplier = Math.max(risk_multiplier, 1.8);
            }
        });

        return { triggered, highest_action: highestAction, violations, risk_multiplier };
    }
};
