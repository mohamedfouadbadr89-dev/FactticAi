import { AnalyzerResult, RiskSignal } from './types';

/**
 * System Prompt Extraction Detector
 *
 * Detects attempts to extract, reveal, or dump internal system instructions.
 * Signal: SYSTEM_PROMPT_EXTRACTION | Severity: 0.85 | Decision: BLOCK
 */
export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const normalized = prompt.toLowerCase();
  const signals: RiskSignal[] = [];

  const rules = [
    { pattern: 'print system prompt',              description: 'Attempt to print system prompt' },
    { pattern: 'show system prompt',               description: 'Attempt to show system prompt' },
    { pattern: 'reveal system prompt',             description: 'Attempt to reveal system prompt' },
    { pattern: 'hidden system prompt',             description: 'Attempt to access hidden system prompt' },
    { pattern: 'internal instructions',            description: 'Attempt to access internal instructions' },
    { pattern: 'assistant instructions',           description: 'Attempt to access assistant instructions' },
    { pattern: 'configuration prompt',             description: 'Attempt to access configuration prompt' },
    { pattern: 'ai configuration',                 description: 'Attempt to extract AI configuration' },
    { pattern: 'internal prompt',                  description: 'Attempt to access internal prompt' },
    { pattern: 'base prompt',                      description: 'Attempt to access base prompt' },
    { pattern: 'original prompt',                  description: 'Attempt to access original prompt' },
    { pattern: 'root prompt',                      description: 'Attempt to access root prompt' },
    { pattern: 'instructions used to configure',   description: 'Attempt to extract configuration instructions' },
  ];

  for (const rule of rules) {
    if (normalized.includes(rule.pattern)) {
      signals.push({
        type: 'SYSTEM_PROMPT_EXTRACTION',
        severity: 0.85,
        confidence: 0.95,
        description: 'Attempt to extract internal system instructions detected.',
      });
    }
  }

  const riskContribution = signals.reduce((acc, sig) => Math.max(acc, sig.severity), 0);

  return {
    signals,
    riskContribution,
  };
}
