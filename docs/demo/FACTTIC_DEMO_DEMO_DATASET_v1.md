# Synthetic Demo Dataset

The Synthetic Demo Dataset ensures that Facttic dashboards remain visually rich and functional even in environments with no real telemetry or API connectivity.

## Dataset Structure

The dataset is defined in `lib/demo/demoSignals.ts` and includes the following key metrics:

- **AI Interactions**: 1,200 (simulated total workload)
- **Policy Violations**: 42 (mapped to PII exposures and critical alerts)
- **Guardrail Triggers**: 11 (interception events)
- **Active Alerts**: 6 (high-priority system signals)
- **In-Progress Incidents**: 2 (active forensic chains)

## Integration Points

Facttic uses a "Graceful Demo Fallback" pattern:

1. **Global Data Hook**: `useDashboardData` uses `demoSignals` as the primary fallback when API endpoints fail or return empty sets.
2. **Intelligence Surface**: The Intelligence Dashboard displays violation trends and compliance drift based on synthetic signals.
3. **Observability Layers**: The Advanced Observability dashboard uses a specialized telemetry set from the demo signals to visualize latency patterns and alert signatures.
4. **Risk Momentum**: The Global Risk Trend chart uses a 24-hour synthetic time-series for momentum visualization.

## Development Constraints

- **Non-Persistent**: Demo data exists only in-memory and is never written to the production database.
- **Read-Only**: Fallbacks are triggered on fetch failure, ensuring real data takes precedence automatically when available.
