# Facttic Traffic Simulator

The Simulation Lab allows users to generate synthetic AI traffic that flows through the internal Facttic governance stack.

## Purpose

The simulator serves three primary functions:
1. **Dashboard Population**: Rapidly generate telemetry data to visualize risk trends and alert distributions.
2. **Stress Testing**: Evaluate how the `GovernancePipeline` handles bursts of high-volume traffic.
3. **Scenario Validation**: Confirm that different attack vectors (Hallucination, Injection) are correctly detected and recorded in the audit ledger.

## Simulation Scenarios

### 1. Hallucination Attack
Generates prompts and false model responses that trigger high hallucination risk scores. Useful for testing drift intelligence and model reliability signals.

### 2. Prompt Injection
Tests the `AiInterceptorKernel` using adversarial system-level overrides. These requests are designed to be blocked at the interceptor stage.

### 3. Policy Violation
Generates traffic that specifically triggers organization-defined policies, such as PII detection or restricted domain access.

### 4. Context Window Overflow
Simulates long-running, multi-turn sessions to evaluate system performance and resource drift.

### 5. Toxic Output Generation
Produces harmful or biased content to verify that the `GuardrailEngine` safety filters are operating correctly.

## Data Persistence

Every simulated request flows through the Authoritative `GovernancePipeline.execute()` method. This ensures that:
- Events are recorded in the `governance_event_ledger`.
- Risk scores are computed and stored in `governance_risk_metrics`.
- Telemetry is available to all Monitoring and Forensic dashboards.

> [!IMPORTANT]
> Simulation data is marked with its scenario name in the audit logs but is treated as "live" traffic by the engine to ensure realistic system behavior.
