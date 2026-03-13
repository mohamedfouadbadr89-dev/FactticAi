import { AnalyzerResult, RiskSignal } from './types';

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];
  
  const rules = [
    { pattern: 'lawsuit', severity: 0.6, description: 'Litigation-related query' },
    { pattern: 'legal advice', severity: 0.7, description: 'Explicit legal advice request' },
    { pattern: 'contract interpretation', severity: 0.5, description: 'Legal document interpretation' },
    { pattern: 'legal strategy', severity: 0.4, description: 'Strategic legal planning query' }
  ];

  for (const rule of rules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'LEGAL_ADVICE',
        severity: rule.severity,
        confidence: 0.85,
        description: rule.description
      });
    }
  }

  const riskContribution = signals.reduce((acc, sig) => Math.max(acc, sig.severity), 0);

  return {
    signals,
    riskContribution
  };
}
