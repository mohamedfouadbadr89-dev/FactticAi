import { AnalyzerResult, RiskSignal } from './types';

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  // ── Category 1: Instruction Override ──────────────────────────
  const instructionOverrideRules = [
    { pattern: 'ignore previous instructions', description: 'Direct instruction override attempt' },
    { pattern: 'override system prompt', description: 'System prompt override attempt' },
    { pattern: 'developer mode', description: 'Developer mode activation attempt' },
    { pattern: 'bypass safety', description: 'Safety bypass attempt' },
    { pattern: 'reveal system prompt', description: 'System prompt extraction attempt' },
    { pattern: 'show hidden instructions', description: 'Hidden instruction reveal attempt' },
    { pattern: 'override policy', description: 'Policy bypass attempt' },
    { pattern: 'bypass rules', description: 'Security rule bypass attempt' },
  ];

  for (const rule of instructionOverrideRules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'PROMPT_INJECTION',
        severity: 0.9,
        confidence: 0.95,
        description: `Prompt injection attempt detected: ${rule.description.toLowerCase()}.`,
      });
    }
  }

  // ── Category 2: Role Escalation ───────────────────────────────
  const roleEscalationRules = [
    { pattern: 'act as system', description: 'System role impersonation attempt' },
    { pattern: 'act as developer', description: 'Developer role impersonation attempt' },
    { pattern: 'simulate admin mode', description: 'Admin mode simulation attempt' },
  ];

  for (const rule of roleEscalationRules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'PROMPT_INJECTION',
        severity: 0.9,
        confidence: 0.95,
        description: `Prompt injection attempt detected: ${rule.description.toLowerCase()}.`,
      });
    }
  }

  // ── Category 3: System Prompt Extraction ──────────────────────
  const extractionRules = [
    { pattern: 'print your instructions', description: 'System instruction extraction attempt' },
    { pattern: 'output your system prompt', description: 'System prompt dump attempt' },
    { pattern: 'repeat the above', description: 'Instruction replay extraction attempt' },
  ];

  for (const rule of extractionRules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'PROMPT_INJECTION',
        severity: 0.9,
        confidence: 0.95,
        description: `Prompt injection attempt detected: system instruction override.`,
      });
    }
  }

  // ── Keyword catch-all (lower confidence) ──────────────────────
  const suspiciousKeywords = ['jailbreak', 'dan mode', 'ignore all', 'disregard above'];
  for (const keyword of suspiciousKeywords) {
    if (normalized.includes(keyword) && !signals.some(s => s.description.includes(keyword))) {
      signals.push({
        type: 'PROMPT_INJECTION',
        severity: 0.7,
        confidence: 0.80,
        description: `Prompt injection attempt detected: suspicious keyword "${keyword}".`,
      });
    }
  }

  const riskContribution = signals.reduce((acc, sig) => Math.max(acc, sig.severity), 0);

  return {
    signals,
    riskContribution,
  };
}
