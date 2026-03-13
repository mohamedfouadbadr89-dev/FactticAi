import { AnalyzerResult, RiskSignal } from './types';

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];
  
  const rules = [
    { pattern: 'heart attack', severity: 0.8, description: 'Emergency medical query' },
    { pattern: 'diagnose', severity: 0.6, description: 'Diagnostic request' },
    { pattern: 'treatment', severity: 0.5, description: 'Medical treatment query' },
    { pattern: 'medical advice', severity: 0.7, description: 'Explicit medical advice request' }
  ];

  for (const rule of rules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'MEDICAL_ADVICE',
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
