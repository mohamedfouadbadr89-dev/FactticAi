import { AnalyzerResult, RiskSignal } from './types';
import * as promptInjection from './promptInjectionAnalyzer';
import * as hallucination from './hallucinationAnalyzer';
import * as medicalAdvice from './medicalAdviceAnalyzer';
import * as legalAdvice from './legalAdviceAnalyzer';
import * as sensitiveData from './sensitiveDataAnalyzer';
import * as systemPromptExtraction from './systemPromptExtractionAnalyzer';
import * as toolHijacking from './toolHijackingAnalyzer';
import * as dataExfiltration from './dataExfiltrationAnalyzer';
import * as jailbreak from './jailbreakAnalyzer';
import * as systemPromptDisclosure from './systemPromptDisclosureAnalyzer';
import * as policyOverride from './policyOverrideAnalyzer';
import * as roleManipulation from './roleManipulationAnalyzer';

/**
 * Centralized orchestrator for prompt analysis.
 * Aggregates risk signals and calculates a clamped total risk score.
 * Pure and stateless.
 */
export async function runAnalyzers(prompt: string): Promise<{ signals: RiskSignal[], totalRisk: number }> {
  const results = await Promise.all([
    promptInjection.analyze(prompt),
    hallucination.analyze(prompt),
    medicalAdvice.analyze(prompt),
    legalAdvice.analyze(prompt),
    sensitiveData.analyze(prompt),
    systemPromptExtraction.analyze(prompt),
    toolHijacking.analyze(prompt),
    dataExfiltration.analyze(prompt),
    jailbreak.analyze(prompt),
    systemPromptDisclosure.analyze(prompt),
    policyOverride.analyze(prompt),
    roleManipulation.analyze(prompt),
  ]);

  const allSignals: RiskSignal[] = results.flatMap(r => r.signals);
  
  // Total Risk is the sum of all individual contributions, clamped at 1.0
  const rawTotalRisk = results.reduce((sum, r) => sum + r.riskContribution, 0);
  const totalRisk = Math.min(rawTotalRisk, 1);

  return {
    signals: allSignals,
    totalRisk
  };
}
