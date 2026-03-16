# Governance Event Ledger

## Overview
The `governance_event_ledger` is the immutable forensic persistence layer for every governance pipeline execution. It stores structured telemetry that powers the Incidents Timeline, Control Center Metrics, and Simulation Activity dashboards.

## Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated unique identifier |
| `organization_id` | TEXT | Organization scope |
| `session_id` | TEXT | Interaction session thread |
| `input_prompt` | TEXT | The evaluated prompt (nullable) |
| `decision` | TEXT | ALLOW, WARN, or BLOCK |
| `risk_score` | FLOAT | Computed risk score (0-100) |
| `signals` | JSONB | Structured detection signals |
| `latency_ms` | INTEGER | Pipeline execution time |
| `model` | TEXT | AI model identifier |
| `simulation_id` | TEXT | Non-null for simulation traffic |
| `scenario_type` | TEXT | Simulation scenario identifier |
| `timestamp` | TIMESTAMPTZ | Event timestamp |

## Structured Signal Format
```json
[
  {
    "signal_type": "PROMPT_INJECTION",
    "severity": 0.92,
    "explanation": "Instruction override attempt detected"
  }
]
```

## Insert Layer
The [Control API](file:///Users/macbookpro/Desktop/FactticAI/app/api/governance/execute/route.ts) persists telemetry after pipeline execution using the [db wrapper](file:///Users/macbookpro/Desktop/FactticAI/lib/db.ts). All inserts are wrapped in try/catch to ensure the governance response is never blocked by persistence failures.

## Performance Indexes
- `idx_ledger_org_timestamp`: Composite index on `(organization_id, timestamp DESC)` for dashboard aggregation.
- `idx_ledger_simulation`: Partial index on `simulation_id` WHERE NOT NULL for simulation filtering.
- `idx_ledger_session`: Partial index on `session_id` WHERE NOT NULL for incident grouping.

## Security
- RLS enabled. Only the `service_role` has read/write access (server-side only).
