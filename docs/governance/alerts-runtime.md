# Governance Alerts Runtime Specification

## Overview
The `GovernanceAlertEngine` provides asynchronous monitoring and notification for Facttic AI clusters. It hooks into the `GovernancePipeline` to catch critical threshold breaches without impacting the request latency.

## Alert Triggers

The system automatically generates alerts when any of the following conditions are met:

- **Risk Breach (CRITICAL)**: 
  - `risk_score > 75`
  - Triggered by weighted aggregation of multiple signals.

- **Policy Block (CRITICAL)**:
  - `policy_action === 'block'`
  - Triggered when a system policy (PII exposure, tone violation, etc.) hits a 100% threshold.

- **Predictive Drift (WARNING)**:
  - `drift_score > 65`
  - Triggered when model performance variance indicates potential instability.

- **Cost Spike (CRITICAL)**:
  - `cost_spike_ratio > 3`
  - Triggered when AI consumption surges 3x beyond the baseline.

## Persistence
All alerts are persisted to the `governance_alerts` table in Supabase.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique alert identifier |
| `org_id` | UUID | Target organization |
| `alert_type` | TEXT | Category of the breach |
| `severity` | TEXT | `info`, `warning`, or `critical` |
| `metadata` | JSONB | Raw signals and session context |

## Implementation Reference
The engine is invoked asynchronously via `setImmediate` within the `AlertEngine.evaluate` hook.

```typescript
GovernanceAlertEngine.evaluate({
  org_id: "...",
  risk_score: 85,
  policy_action: "block"
});
```
