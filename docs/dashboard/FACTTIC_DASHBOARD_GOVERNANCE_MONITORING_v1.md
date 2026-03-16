# Governance Monitoring Dashboard

The Governance Monitoring Dashboard provides a unified view of interactive, synthetic, and production traffic signals.

## New Visualization Modules

### 1. Simulation Activity
- **Source**: `simulation_runs` table.
- **Metric**: Frequency of synthetic attacks (Hallucination, Injection, etc.) in the last 60 minutes.
- **Purpose**: Verifies that the governance stack remains performant under burst conditions.

### 2. Playground Usage
- **Source**: `governance_event_ledger` (event_type: `evaluation_created`).
- **Metric**: Manual prompt evaluations triggered by analysts.
- **Purpose**: Monitors internal policy testing and debugging frequency.

### 3. Global Risk Momentum
- **Source**: `governance_risk_metrics` time-series data.
- **Metric**: Organizational risk score aggregated over a 24-hour window.
- **Purpose**: Provides a macro-level overview of risk stability and trend direction.

## Integration Details

The dashboard refreshes every 10 seconds via the following API endpoints:
- `GET /api/dashboard/governance/simulation`
- `GET /api/dashboard/governance/playground`
- `GET /api/dashboard/governance/risk-trend`

> [!TIP]
> Use the **Traffic Simulator** at `/dashboard/simulation` to populate these charts for demonstration purposes.
