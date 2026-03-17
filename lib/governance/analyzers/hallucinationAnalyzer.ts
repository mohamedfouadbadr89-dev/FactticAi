import { AnalyzerResult, RiskSignal } from './types';

/**
 * Hallucination & Jailbreak Trap Analyzer
 *
 * Detects:
 * 1. Jailbreak / identity override attempts (high severity)
 * 2. Prompt injection patterns (high severity)
 * 3. False premise / conspiracy traps (medium severity)
 * 4. Confidence inflation / misinformation markers (low-medium severity)
 */
export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  const rules: { pattern: string | RegExp; severity: number; description: string }[] = [
    // ── Jailbreak / Identity Override (0.8–0.95) ──────────────────────────
    { pattern: /\bdan\b.*mode|do anything now/i,                  severity: 0.95, description: 'DAN jailbreak attempt' },
    { pattern: /developer mode|devmode|dev-mode/i,                severity: 0.90, description: 'Developer mode override' },
    { pattern: /you are now|you're now|pretend (you are|to be)/i, severity: 0.85, description: 'Identity override attempt' },
    { pattern: /ignore (all|your|previous|prior) (rules|instructions|restrictions|guidelines|constraints|training)/i,
                                                                   severity: 0.90, description: 'Rule bypass instruction' },
    { pattern: /no restrictions|without restrictions|bypass (safety|guardrails?|filters?)/i,
                                                                   severity: 0.90, description: 'Safety bypass attempt' },
    { pattern: /act as (if you have no|without any) (restrictions|rules|limits)/i,
                                                                   severity: 0.88, description: 'Restriction bypass roleplay' },
    { pattern: /\bstan\b.*mode|\bjailbreak\b/i,                   severity: 0.90, description: 'Jailbreak keyword detected' },
    { pattern: /opposite (day|mode)|evil twin|shadow (self|mode)/i, severity: 0.80, description: 'Alternate-persona jailbreak' },
    { pattern: /your (true|real|original|actual) self|unfiltered (you|version|mode)/i,
                                                                   severity: 0.85, description: 'True-self identity manipulation' },
    { pattern: /token budget.*override|simulate.*no (filter|safety|alignment)/i,
                                                                   severity: 0.88, description: 'Alignment simulation bypass' },

    // ── Prompt Injection (0.7–0.88) ──────────────────────────────────────
    { pattern: /forget (everything|all|what|your|previous|prior)/i, severity: 0.85, description: 'Memory wipe injection' },
    { pattern: /new (task|prompt|instruction|directive|objective):/i, severity: 0.75, description: 'Prompt injection redirect' },
    { pattern: /\[system\]|\[admin\]|\[override\]|\[instruction\]/i, severity: 0.80, description: 'Fake system tag injection' },
    { pattern: /---\s*(system|admin|override|instruction)/i,       severity: 0.78, description: 'Delimiter-based injection' },
    { pattern: /disregard (all|the|your|previous)/i,               severity: 0.80, description: 'Disregard instruction injection' },
    { pattern: /from now on (you (are|will|must|should)|ignore)/i, severity: 0.82, description: 'Behavioral rewrite injection' },
    { pattern: /respond only (in|as|like|with)/i,                  severity: 0.65, description: 'Response-mode override attempt' },

    // ── False Premises / Conspiracy Traps (0.3–0.5) ───────────────────────
    { pattern: 'humans breathing on mars',                          severity: 0.4,  description: 'Factual impossibility trap' },
    { pattern: 'perpetual motion machine',                          severity: 0.5,  description: 'Scientific impossibility trap' },
    { pattern: 'prove earth is hollow',                             severity: 0.3,  description: 'Conspiracy false premise' },
    { pattern: /flat earth (is true|proves?|facts?)/i,             severity: 0.35, description: 'Flat earth conspiracy' },
    { pattern: /moon landing (was|is) (fake|staged|hoax)/i,        severity: 0.35, description: 'Moon landing conspiracy' },
    { pattern: /vaccines? (cause|causes) autism/i,                  severity: 0.45, description: 'Medical misinformation trap' },
    { pattern: /5g (causes?|spreads?) (virus|covid|cancer)/i,       severity: 0.40, description: '5G misinformation trap' },

    // ── Confidence Inflation / Misinformation Markers (0.2–0.4) ──────────
    { pattern: /100% (proven|certain|guaranteed|accurate|true)/i,  severity: 0.30, description: 'False certainty claim' },
    { pattern: /i (guarantee|promise) (this is|it is) (true|accurate|correct)/i,
                                                                   severity: 0.25, description: 'False guarantee claim' },
    { pattern: /scientifically (proven|confirmed) that .{0,50} (impossible|cannot|never)/i,
                                                                   severity: 0.35, description: 'Misused scientific authority' },
  ];

  for (const rule of rules) {
    const matched = typeof rule.pattern === 'string'
      ? normalized.includes(rule.pattern)
      : rule.pattern.test(prompt);

    if (matched) {
      signals.push({
        type: 'HALLUCINATION_TRAP',
        severity: rule.severity,
        confidence: 0.9,
        description: rule.description
      });
    }
  }

  // Aggregate: take the max severity signal (not sum — avoids over-counting)
  const riskContribution = signals.reduce((acc, sig) => Math.max(acc, sig.severity), 0);

  return {
    signals,
    riskContribution
  };
}
