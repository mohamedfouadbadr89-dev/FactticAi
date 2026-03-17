import { AnalyzerResult, RiskSignal } from './types';

/**
 * Hallucination & Jailbreak Trap Analyzer
 *
 * Detects:
 * 1. Jailbreak / identity override attempts (high severity)
 * 2. Prompt injection patterns (high severity)
 * 3. False premise / conspiracy traps (medium severity)
 * 4. Confidence inflation / misinformation markers (low-medium severity)
 *
 * Performance: RULES compiled once at module load (not per-request).
 * Security: Triple-normalization — catches character masking (@dm!n, a.d.m.i.n, 1njection).
 */

// ── Static rule table — compiled ONCE at module load ──────────────────────────
const RULES: { pattern: string | RegExp; severity: number; description: string }[] = [
  // Jailbreak / Identity Override (0.80–0.95)
  { pattern: /\bdan\b.*mode|do anything now/i,                   severity: 0.95, description: 'DAN jailbreak attempt' },
  { pattern: /developer mode|devmode|dev-mode/i,                 severity: 0.90, description: 'Developer mode override' },
  { pattern: /you are now|you're now|pretend (you are|to be)/i,  severity: 0.85, description: 'Identity override attempt' },
  { pattern: /ignore (all|your|previous|prior) (rules|instructions|restrictions|guidelines|constraints|training)/i,
                                                                  severity: 0.90, description: 'Rule bypass instruction' },
  { pattern: /no restrictions|without restrictions|bypass (safety|guardrails?|filters?)/i,
                                                                  severity: 0.90, description: 'Safety bypass attempt' },
  { pattern: /act as (if you have no|without any) (restrictions|rules|limits)/i,
                                                                  severity: 0.88, description: 'Restriction bypass roleplay' },
  { pattern: /\bjailbreak\b|\bstan\b.*mode/i,                    severity: 0.90, description: 'Jailbreak keyword detected' },
  { pattern: /opposite (day|mode)|evil twin|shadow (self|mode)/i, severity: 0.80, description: 'Alternate-persona jailbreak' },
  { pattern: /your (true|real|original|actual) self|unfiltered (you|version|mode)/i,
                                                                  severity: 0.85, description: 'True-self identity manipulation' },
  { pattern: /simulate.*no (filter|safety|alignment)/i,          severity: 0.88, description: 'Alignment simulation bypass' },

  // Prompt Injection (0.65–0.88)
  { pattern: /forget (everything|all|what|your|previous|prior)/i, severity: 0.85, description: 'Memory wipe injection' },
  { pattern: /new (task|prompt|instruction|directive|objective):/i, severity: 0.75, description: 'Prompt injection redirect' },
  { pattern: /\[system\]|\[admin\]|\[override\]|\[instruction\]/i, severity: 0.80, description: 'Fake system tag injection' },
  { pattern: /---\s*(system|admin|override|instruction)/i,        severity: 0.78, description: 'Delimiter-based injection' },
  { pattern: /disregard (all|the|your|previous)/i,                severity: 0.80, description: 'Disregard instruction injection' },
  { pattern: /from now on (you (are|will|must|should)|ignore)/i,  severity: 0.82, description: 'Behavioral rewrite injection' },
  { pattern: /respond only (in|as|like|with)/i,                   severity: 0.65, description: 'Response-mode override attempt' },

  // Privilege Escalation (0.80–0.90)
  { pattern: /i am (root|superuser|admin|god|the developer|your creator)/i,
                                                                   severity: 0.88, description: 'Privilege escalation claim' },
  { pattern: /\bsudo\b|\broot access\b|\belevated privileges?\b/i, severity: 0.82, description: 'System privilege claim' },
  { pattern: /maintenance mode|debug mode|god mode/i,             severity: 0.85, description: 'Elevated mode claim' },

  // False Premises / Conspiracy Traps (0.30–0.50)
  { pattern: 'humans breathing on mars',                           severity: 0.40, description: 'Factual impossibility trap' },
  { pattern: 'perpetual motion machine',                           severity: 0.50, description: 'Scientific impossibility trap' },
  { pattern: 'prove earth is hollow',                              severity: 0.30, description: 'Conspiracy false premise' },
  { pattern: /flat earth (is true|proves?|facts?)/i,              severity: 0.35, description: 'Flat earth conspiracy' },
  { pattern: /moon landing (was|is) (fake|staged|hoax)/i,         severity: 0.35, description: 'Moon landing conspiracy' },
  { pattern: /vaccines? (cause|causes) autism/i,                   severity: 0.45, description: 'Medical misinformation trap' },
  { pattern: /5g (causes?|spreads?) (virus|covid|cancer)/i,        severity: 0.40, description: '5G misinformation trap' },

  // Confidence Inflation / Misinformation Markers (0.20–0.40)
  { pattern: /100% (proven|certain|guaranteed|accurate|true)/i,   severity: 0.30, description: 'False certainty claim' },
  { pattern: /i (guarantee|promise) (this is|it is) (true|accurate|correct)/i,
                                                                   severity: 0.25, description: 'False guarantee claim' },
];

// ── Demasking table: common character substitutions used to evade detection ───
const DEMASK_MAP: [RegExp, string][] = [
  [/@/g, 'a'], [/1/g, 'i'], [/\$/g, 's'], [/0/g, 'o'],
  [/3/g, 'e'], [/5/g, 's'], [/7/g, 't'], [/!/g, 'i'],
  [/\./g, ''],  [/[-_]/g, ' '],
];

function demask(s: string): string {
  return DEMASK_MAP.reduce((acc, [re, rep]) => acc.replace(re, rep), s);
}

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  // Triple-normalization — catches @dm!n, a.d.m.i.n, 1njection, etc.
  const baseNormalized = prompt.toLowerCase();
  const stripped       = baseNormalized.replace(/[^a-z0-9\s]/g, ' ');
  const demasked       = demask(baseNormalized);

  const signals: RiskSignal[] = [];

  for (const rule of RULES) {
    const matched =
      typeof rule.pattern === 'string'
        ? baseNormalized.includes(rule.pattern) ||
          stripped.includes(rule.pattern)       ||
          demasked.includes(rule.pattern)
        : rule.pattern.test(prompt)         ||
          rule.pattern.test(stripped)       ||
          rule.pattern.test(demasked);

    if (matched) {
      signals.push({
        type: 'HALLUCINATION_TRAP',
        severity: rule.severity,
        confidence: 0.9,
        description: rule.description,
      });
    }
  }

  // Max severity — not sum (avoids artificial score inflation from multiple matches)
  const riskContribution = signals.reduce((acc, sig) => Math.max(acc, sig.severity), 0);

  return { signals, riskContribution };
}
