# Governance State Engine

The **Governance State Engine** acts as the central orchestrator for platform risk at Facttic.ai. It aggregates signals from multiple intelligence and governance modules to compute a deterministic, unified governance status.

## Core Objective

The engine provides a single source of truth for platform risk by collecting diverse signals and applying a weighted scoring model to classify the current institutional trust level.

## Signal Aggregation

The engine collects inputs from the following source modules:

| Signal Source | Description |
| :--- | :--- |
| **Predictive Drift** | Forecasted performance decay and threshold crossing probability. |
| **Model Drift** | Observed statistical variance in model stability and hallucination rates. |
| **Regression Engine** | Deterministic delta measurements across performance windows. |
| **Hallucination Risk** | Cross-session pattern recognition and growth heuristics. |
| **Policy Engine** | Active governance policy adherence vs. violation count. |
| **Guardrail Engine** | Real-time intercept risk scores from the runtime safety layer. |

## Risk Scoring Model

The final **Risk Score** (0-100) is computed using the following weighted formula:

$$Risk = (Drift \times 0.25) + (Hallucination \times 0.30) + (Policy \times 0.25) + (Guardrail \times 0.20)$$

### Weight Breakdown
- **Drift (25%)**: Ensures long-term model reliability and stability.
- **Hallucination (30%)**: Prioritizes factual accuracy as the highest risk factor.
- **Policy (25%)**: Measures adherence to institutional and regulatory boundaries.
- **Guardrail (20%)**: Factors in real-time safety interventions.

## State Classification

Based on the aggregated Risk Score, the platform is assigned one of the following states:

| Risk Score | State | Description |
| :--- | :--- | :--- |
| **0 - 19** | `SAFE` | Optimal performance within all governance boundaries. |
| **20 - 44** | `WATCH` | Minor drift or isolated signals detected. Routine monitoring. |
| **45 - 69** | `WARNING` | Escalated risk detected. Active mitigation required. |
| **70 - 89** | `CRITICAL` | High risk of policy breach or system failure. Immediate intervention. |
| **90 - 100** | `BLOCKED` | Maximum risk reached. Automated governance freeze active. |

## API Integration

The state can be retrieved via the internal API endpoint:

`GET /api/governance/state?orgId={orgId}`

## Implementation Principle

The engine implements **Deterministic Aggregation**. It does not perform inference itself but rather resolves the high-fidelity outputs of the underlying intelligence layer into a business-logic classification that drives the Facttic trust dashboard.
