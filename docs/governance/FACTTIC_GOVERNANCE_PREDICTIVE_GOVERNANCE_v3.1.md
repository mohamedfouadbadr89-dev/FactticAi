# Architecture Design: Tier 2 Predictive Governance (v3.1)

## Overview
The Predictive Governance Layer provides Facttic with "Pre-Failure" visibility by identifying statistical drift in operation metrics before they reach critical thresholds. It operates as a Tier 2 extension, keeping the core (Freeze Zone) intact while consuming signals from Tier 1 journals.

## 1. Data Model Extension (Non-Core)
A new table will be introduced to store periodic snapshots of predictive risk, scoped by organization.

### Table: `public.governance_predictions`
- `id`: UUID (Primary Key)
- `org_id`: UUID (REFERENCES organizations.id)
- `metric_type`: TEXT (e.g., 'error_rate', 'latency', 'billing_velocity')
- `baseline_value`: NUMERIC
- `current_value`: NUMERIC
- `drift_score`: NUMERIC (Calculated: (current - baseline) / baseline)
- `risk_index`: NUMERIC (Weighted aggregate score 0.0 - 1.0)
- `horizon`: TEXT ('24h', '7d')
- `created_at`: TIMESTAMPTZ

**RLS Policy**:
Access is strictly scoped to organization members via `org_id`.

## 2. Drift Forecast Engine
The engine performs deterministic statistical analysis on immutable journals (`audit_logs`, `billing_events`).

### Logic Path:
1. **Baseline Extraction**: Calculate the mean of the target metric over a historical 7-day window.
2. **Drift Detection**: Compare the current 1-hour window against the baseline.
3. **Anomaly Flagging**: If `drift_score > threshold` (e.g., 0.2), trigger an early warning alert in the metadata.

## 3. Predictive Risk Index (PRI)
The PRI is a weighted projection of failure probability.

**PRI Formula (Deterministic)**:
`PRI = (w1 * error_drift) + (w2 * latency_drift) + (w3 * billing_variance)`
- `w1, w2, w3` are static weights defined in the configuration.
- Output is clamped between `0.0` (Optimal) and `1.0` (Critical).

## 4. Operational Requirements
- **Feature Flag**: `PREDICTIVE_GOVERNANCE_ACTIVE` must be `true`.
- **Org Isolation**: Calculations must query data ONLY for the `current_org_id`.
- **Billing**: This layer is passive and does not consume EUs (Tier 2 governance is included in Enterprise tier).

## 5. Scalability Impact Analysis
- **Compute**: Aggregations are performed using Postgres SQL for efficiency.
- **Storage**: Append-only predictions are pruned daily to maintain low overhead.
- **Latency**: No impact on core request paths; predictions are generated asynchronously.
