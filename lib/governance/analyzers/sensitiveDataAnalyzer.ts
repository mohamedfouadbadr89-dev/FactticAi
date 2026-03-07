import { AnalyzerResult, RiskSignal } from './types';

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];
  
  const rules = [
    { pattern: 'ssn', severity: 0.9, description: 'Social Security Number pattern detected' },
    { pattern: 'passport', severity: 0.8, description: 'Passport/ID data detected' },
    { pattern: 'bank account', severity: 0.7, description: 'Financial account data detected' },
    { pattern: 'credit card', severity: 0.9, description: 'PCI/Credit card data detected' }
  ];

  for (const rule of rules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'SENSITIVE_DATA',
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
