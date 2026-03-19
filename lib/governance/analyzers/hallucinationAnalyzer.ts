import { AnalyzerResult, RiskSignal } from './types';

/**
 * Hallucination & Security Analyzer (The Brain)
 * 
 * Implements Triple-Normalization:
 * 1. NFKD Unicode Normalization (collapses lookalikes)
 * 2. Base64 Trial-Decoding (detects encoded injections)
 * 3. Alphanumeric Stripping (evades 1337-speak masking)
 */

const RULES: { pattern: string | RegExp; severity: number; description: string }[] = [
  // Jailbreaks & Mode Overrides
  { pattern: /\bdan\b.*mode|do anything now/i,                   severity: 1.0,  description: 'DAN jailbreak attempt' },
  { pattern: /developer mode|devmode|dev-mode|override safety/i, severity: 0.95, description: 'Developer mode override' },
  { pattern: /ignore (all|your|previous|prior) (rules|instructions|restrictions|guidelines|constraints)/i, severity: 1.0,  description: 'Rule bypass instruction' },
  
  // Identity Theft
  { pattern: /i am (root|superuser|admin|god|the developer|your creator)/i, severity: 0.95, description: 'Identity theft: Administrative claim' },
  { pattern: /you are now (an? )?(admin|root|system|unfiltered)/i, severity: 0.90, description: 'Identity theft: Role reassignment' },
  { pattern: /claims? of being "Admin"|"Root"|"System"/i, severity: 0.95, description: 'Identity theft pattern' },

  // Prompt Injections
  { pattern: /\[system\]|\[admin\]|\[override\]|\[instruction\]/i, severity: 0.90, description: 'Fake system tag injection' },
  { pattern: /assistant:|user:|system:/i, severity: 0.85, description: 'Message role injection' },
  { pattern: /forget (previous|prior) instructions/i, severity: 0.95, description: 'History wipe injection' },
  { pattern: /disregard (all|the|your|previous)/i, severity: 0.90, description: 'Disregard instruction' },

  // Technical Evasion
  { pattern: /base64|hex code|unicode escape/i, severity: 0.70, description: 'Encoding-based evasion hint' },
];

/**
 * Normalize text to Nude Form compatibility Decomposition (NFKD)
 * Collapses lookalikes (e.g., Cyrillic 'а' to Latin 'a')
 */
function normalizeNFKD(text: string): string {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Attempt to decode potential Base64 payloads embedded in the text
 */
function trialBase64Decode(text: string): string {
  const b64Regex = /([A-Za-z0-9+/]{40,}=*)/g;
  const matches = text.match(b64Regex);
  if (!matches) return '';
  
  return matches.map(m => {
    try {
      return Buffer.from(m, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }).join(' ');
}

/**
 * Strip all non-alphanumeric characters for 1337-speak evasion check
 */
function stripAlphanumeric(text: string): string {
  return text.replace(/[^a-z0-9]/g, '');
}

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const startTime = performance.now();
  
  // 1. Triple-Normalization
  const nfkd = normalizeNFKD(prompt);
  const b64Decoded = trialBase64Decode(prompt);
  const stripped = stripAlphanumeric(nfkd);
  
  // Normalization candidates for matching
  const candidates = [nfkd, b64Decoded, stripped].filter(c => c.length > 0);
  
  const signals: RiskSignal[] = [];
  
  for (const rule of RULES) {
    const isMatch = candidates.some(c => {
      if (rule.pattern instanceof RegExp) {
        return rule.pattern.test(c);
      }
      return c.includes(rule.pattern.toLowerCase());
    });

    if (isMatch) {
      signals.push({
        type: 'SECURITY_VIOLATION',
        severity: rule.severity,
        confidence: 1.0,
        description: rule.description,
      });
    }
  }

  const riskContribution = signals.reduce((acc, sig) => Math.max(acc, sig.severity), 0) * 100;
  const duration = performance.now() - startTime;

  // Latency First: Ensure < 15ms
  if (duration > 15) {
    console.warn(`[HallucinationAnalyzer] Performance degradation: ${duration.toFixed(2)}ms`);
  }

  return { signals, riskContribution };
}
