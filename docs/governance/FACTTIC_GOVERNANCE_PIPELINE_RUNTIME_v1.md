# Governance Pipeline Runtime

## Overview
The Facttic Governance Pipeline (v4.3) orchestrates the end-to-end execution of AI safety, policy, and risk engines. It ensures that every AI request is evaluated through a deterministic sequence of protection layers.

## Orchestration Flow

The execution follows a strict sequential hierarchy to maximize safety and minimize latency:

1.  **AiInterceptorKernel (Prompt Protection)**
    - Scans incoming prompts for injection attacks and PII.
    - Immediate `BLOCK` trigger if critical violations are detected.

2.  **PolicyEngine (Static Rules)**
    - Loads organization-specific governance policies.
    - Evaluates signals against defined thresholds (Hallucination, Tone, PII, etc.).

3.  **GuardrailEngine (Stochastic Analysis)**
    - Performs deep analysis of the model response.
    - Measures hallucination probability and safety risk scores.

4.  **RiskMetricsEngine (Aggregation)**
    - Combines distributed signals into a unified risk score.
    - Weights factors such as behavior drift, cost anomalies, and guardrail breaches.

5.  **GovernanceStateEngine (Cluster Stability)**
    - Evaluates the overall health state of the organization's AI cluster (`SAFE`, `UNSTABLE`, `CRITICAL`).

6.  **GovernanceAlertEngine (Notification)**
    - Triggers asynchronous alerts for risk breaches (>75) or policy blocks.

## Implementation Details
The pipeline is accessible via the `GovernancePipeline.execute` method, which is the authoritative entry point for all governance evaluation APIs.

```typescript
import { GovernancePipeline } from "@/lib/governancePipeline";

const result = await GovernancePipeline.execute({
  org_id: "...",
  session_id: "...",
  prompt: "...",
  response: "..."
});
```

## Security & Isolation
The pipeline enforces organizational isolation via multi-tenant data fetching and ensures that PII masking is applied at both the prompt and response stages before any analytical persistence occurs.
