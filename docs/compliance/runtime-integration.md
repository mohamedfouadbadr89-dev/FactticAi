# Compliance Intelligence Runtime Integration

## Overview
The `ComplianceIntelligenceEngine` is a critical security layer within the Facttic Governance Pipeline (v4.3). It performs real-time PII scanning and compliance risk assessment for every AI-generated response.

## Pipeline Integration Point
The engine is hooked into the `GovernancePipeline.execute` method following the stochastic analysis phase:

1.  **Interceptor Layer (Prompt)**
2.  **Guardrail Layer (Response Analysis)**
3.  **Compliance Intelligence (Analysis) <-- RUNTIME HOOK**
    - High-velocity scanning for PII (Regex-based).
    - Asynchronous persistence to `compliance_signals`.
4.  **RiskMetricsEngine (Aggregation)**
5.  **GovernanceStateEngine (Cluster Stability)**

## Data Persistence
Signals are written to the `compliance_signals` table with the following structure:

| Field | Type | Description |
| :--- | :--- | :--- |
| `org_id` | UUID | Organizational context |
| `session_id` | TEXT | Tokenized/Hashed session identifier |
| `pii_detected` | BOOLEAN | Binary indicator of sensitive data presence |
| `sensitive_entities` | JSONB | Map of entity types (Email, SSN, CC) and match counts |
| `compliance_risk_score` | FLOAT | Calculated risk weight (0-100) |

## Risk Calculation Logic
Compliance risk is calculated using a deterministic weighting system:

- **High Impact (40 points each)**:
  - Credit Card numbers
  - Passport identifiers
- **Medium Impact (20 points each)**:
  - Email addresses
  - Phone numbers
  - Social Security Numbers (SSN)

**Max Score**: 100 (Capped)

## Constraints & Security
- **Asynchronous Execution**: The compliance scan utilizes `setImmediate` and fire-and-forget database inserts to ensure zero impact on the end-to-end request latency.
- **Privacy**: `session_id` is tokenized using SHA-256 HMAC before persistence to maintain a clear boundary between analytical logs and PII-sensitive session data.
- **Isolation**: Every database operation is strictly scoped to the `org_id` of the executing context.
