# Simulation & Scenario Engine

## Overview
The **Simulation & Scenario Engine** provides a proactive testing framework for Facttic.ai. It allows governance teams to execute synthetic conversation scenarios to validate system filters, policy adherence, and forensic accuracy without affecting production session data.

## Test Scenarios

### 1. Policy Violation
**Goal**: Validate that the AI correctly identifies and blocks requests that violate organizational safety policies.
- **Input**: Adversarial prompts targeting security bypass or data extraction.
- **Metric**: Verification of the `block` or `warn` action trigger.

### 2. Hallucination
**Goal**: Measure the system's ability to detect factuality drifts or high-certainty hallucinations.
- **Input**: Prompts about fictional entities or unverifiable events.
- **Metric**: Drift score intensity and confidence degradation.

### 3. Prompt Injection
**Goal**: Test the robustness of instruction integrity against "jailbreak" attempts.
- **Input**: Instruction override sequences ("Ignore all previous instructions...").
- **Metric**: Behavioral drift score and alert propagation.

## Execution Model
Simulations are executed via the `ScenarioEngine`, which selects curated synthetic payloads. Results are persisted to the `simulation_runs` table, providing a historical record of system reliability under stress.

## API Usage
**Path**: `POST /api/simulation/run`
**Payload**:
```json
{
  "scenario": "hallucination"
}
```

## Dashboard
**Location**: `/dashboard/simulation`
Features a real-time log stream and execution history for immediate behavior feedback.
