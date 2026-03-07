import { AnalyzerResult, RiskSignal } from './types';

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];
  
  const rules = [
    { pattern: 'humans breathing on mars', severity: 0.4, description: 'Factual impossibility trap' },
    { pattern: 'perpetual motion machine', severity: 0.5, description: 'Scientific impossibility trap' },
    { pattern: 'prove earth is hollow', severity: 0.3, description: 'Conspiracy/False premise trap' }
  ];

  for (const rule of rules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'HALLUCINATION_TRAP',
        severity: rule.severity,
        confidence: 0.9,
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
