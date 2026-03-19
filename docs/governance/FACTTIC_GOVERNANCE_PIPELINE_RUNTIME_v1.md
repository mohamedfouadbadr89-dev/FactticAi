# Governance Pipeline Runtime (v5.0 — Production)
Verified against Live Supabase Production on March 19, 2026.

## Overview
The Facttic Governance Pipeline (v5.0) orchestrates the end-to-end execution of AI safety, policy, and risk engines. It operates as a strict **Fail-Closed Reactive System**, prioritizing low-latency guardrails over processing completion to ensure deterministic protection of enterprise AI data.

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

6.  **Voice Engine Upgrade (Real-time Telemetry)**
    - Verifies **True Latency** (Clock-Sync) between client and server.
    - If `Latency > 150ms`, triggers an immediate `BLOCK`.
    - Handles **Barge-In Escalation** logic to detect session instability.

## Deterministic Safety Gates

To prevent "Security Theater" and ensure system resilience, the following gates are hard-coded in the runtime:

1.  **50ms Hard-Stop (AbortController)**: The entire pipeline execution is wrapped in a 50ms `Promise.race`. If any dependency lags, the system deterministically returns a `BLOCK` response.
2.  **30ms Atomic Ledger (Fail-Closed Persistence)**: Every governance decision must be cryptographically hashed and written to the `EvidenceLedger` within 30ms. If the database write exceeds this budget, the pipeline returns a `BLOCK` to prevent "Ghost Evaluations" (untracked decisions).
3.  **Kill-Switch Signal**: For Voice sessions, a `risk_score > 85` triggers an immediate `INTERRUPT` signal (`KILL_AUDIO_STREAM`) sent to the edge hardware.

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
