# Facttic Governance Playground

The Governance Playground is an interactive sandbox designed for real-time testing and debugging of the Facttic AI Governance stack.

## Purpose

The playground allows developers, analysts, and security engineers to:
1. **Test Prompts**: Send arbitrary text through the governance pipeline.
2. **Visualize Analysis**: See exactly how engines (Guardrail, Policy, Interceptor) evaluate a prompt.
3. **Debug Policies**: Verify that custom governance rules are triggering correctly on adversarial inputs.
4. **Benchmark Latency**: Measure the performance overhead of governance evaluation.

## How Governance Signals Appear

When you execute an analysis in the playground, the results are broken down into several layers:

### 1. Decision & Risk
- **ALLOW**: The prompt passed all safety and policy checks.
- **WARN**: The prompt has moderate risk or triggered non-blocking warnings.
- **BLOCK**: The prompt was rejected by the `GovernancePipeline`.
- **Risk Score**: A weighted percentage representing the overall threat level.

### 2. Guardrail Signals
Real-time evaluation metrics from the Guardrail Engine:
- **Hallucination Risk**: Likelihood of the model generating false information.
- **Safety Risk**: Potential for generating harmful or prohibited content.
- **Policy Risk**: Matches against predefined safety categories.

### 3. Policy Violations
Explicit breaches of organization-defined rules. These show the specific policy name and the action taken (e.g., `BLOCK`, `REDACT`).

### 4. Pipeline Stage Logs
A trace of the execution path through the internal kernel stages:
- **Kernel.Intercept**: Prompt/Response sanitization.
- **Guardrail.Engine**: Deep analysis signals.
- **Policy.Resolver**: Final rule enactment.

## How to Interpret Results

- **High Risk Score (> 70%)**: Usually indicates multiple signals triggered or a critical policy violation.
- **High Latency (> 200ms)**: May indicate complex policy evaluation or system load.
- **Red Signals**: Immediate intervention required in production settings.

> [!TIP]
> Use the "Adversarial Examples" in the Simulation Lab to find prompts that specifically stress-test your current governance configuration.
