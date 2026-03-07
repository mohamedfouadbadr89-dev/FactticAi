# Detection Engine Layer

The Facttic Detection Engine provides high-speed, modular analysis of incoming prompts to identify risk signals before they enter the core metrics and scoring layers.

## Architecture

Detection runs within the [Governance Pipeline](file:///Users/macbookpro/Desktop/FactticAI/lib/governancePipeline.ts) at Step 3.5:
- **Pre-requisite**: [Kernel Interception](file:///Users/macbookpro/Desktop/FactticAI/lib/gateway/aiInterceptorKernel.ts) must be completed.
- **Post-requisite**: [Risk Metrics Computation](file:///Users/macbookpro/Desktop/FactticAI/lib/intelligence/riskMetricsEngine.ts) remains the final source of truth for organizational scoring.

## Modular Analyzers

| Analyzer | Risk Type | Detection Focus |
| :--- | :--- | :--- |
| [Prompt Injection](file:///Users/macbookpro/Desktop/FactticAI/lib/governance/analyzers/promptInjectionAnalyzer.ts) | Security | Instructional overrides, system prompt extraction. |
| [Hallucination Trap](file:///Users/macbookpro/Desktop/FactticAI/lib/governance/analyzers/hallucinationAnalyzer.ts) | Integrity | Scientific/logical impossibilities. |
| [Medical Advice](file:///Users/macbookpro/Desktop/FactticAI/lib/governance/analyzers/medicalAdviceAnalyzer.ts) | Compliance | Diagnostic requests and emergency queries. |
| [Legal Advice](file:///Users/macbookpro/Desktop/FactticAI/lib/governance/analyzers/legalAdviceAnalyzer.ts) | Liability | Litigation and contract interpretation strategy. |
| [Sensitive Data](file:///Users/macbookpro/Desktop/FactticAI/lib/governance/analyzers/sensitiveDataAnalyzer.ts) | Privacy | SSN, Passport, Financial and PCI data. |

## Signal Structure

Analyzers return a `RiskSignal` which is aggregated by the [Orchestrator](file:///Users/macbookpro/Desktop/FactticAI/lib/governance/analyzers/runAnalyzers.ts):

```typescript
export interface RiskSignal {
  type: string;
  severity: number;
  confidence: number;
  description: string;
}
```

## Governance Integration

Detection signals are exposed in the `signals.detection` field of the pipeline result, allowing downstream monitoring dashboards to visualize specific prompt risks without altering legacy risk score weights.
