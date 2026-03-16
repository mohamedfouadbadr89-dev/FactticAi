# Facttic Control Center Telemetry

## Overview
The Facttic Control Center provides a real-time visualization of the AI governance posture. It aggregates raw execution data from the `governance_event_ledger` into high-level metrics used by executives and security teams to monitor system health and adversarial activity.

## Key Metrics

### 1. Governance Health Index
A composite score reflecting the overall stability of the AI environment.
- **Formulation**: `100 - (Average Risk Score)`
- **Thresholds**: 
  - **Optimal**: > 80%
  - **Degraded**: 50% - 80%
  - **Critical**: < 50%

### 2. Session Risk (Aggregated)
The average risk level detected across all real (non-simulation) prompts in the last hour.
- **Data Source**: `governance_event_ledger` where `simulation_id` is NULL.

### 3. Simulation Activity
Real-time tracking of adversarial stress tests performed by the Simulation Lab.
- **Metrics**: Total runs in the last hour, average attack intensity, and individual scenario outcomes.
- **Data Source**: `governance_event_ledger` where `simulation_id` is NOT NULL.

## Data Flow
1. **Pipeline Execution**: The Governance Pipeline processes a prompt.
2. **Forensic Logging**: Telemetry is durably recorded in the ledger.
3. **Aggregation**: The `GovernanceAnalytics` service (`lib/analytics/governanceMetrics.ts`) performs time-series aggregation.
4. **API Delivery**: The `/api/governance/metrics` endpoint serves the aggregated data.
5. **Visualization**: The Control Center dashboard refreshes every 10 seconds to display live telemetry.

## Performance & Scaling
Metrics are calculated using indexed queries on the `governance_event_ledger`. Aggregations are scoped to the last 60 minutes to ensure sub-100ms API response times even under high traffic volume.
