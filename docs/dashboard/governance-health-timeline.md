# Governance Health Timeline

The **Governance Health Timeline** provides a high-fidelity visualization of the organization's AI safety posture over time. It allows executives to monitor long-term trends and identify specific periods of risk contagion or policy instability.

## Metric Calculation

The timeline visualizes the **Governance Health Index**, calculated as:
`health = 100 - risk_score`

- **Risk Score**: The aggregated risk value from `governance_risk_metrics`, combining policy hits, guardrail triggers, and behavioral anomalies.
- **Health Index**: A percentage representing the system's operational integrity. 100% indicates optimal governance.

## Observation Windows

The timeline supports three primary observation windows:
1.  **24 Hours**: Real-time monitoring of daily operations and recent spikes.
2.  **7 Days**: Weekly trend analysis for detecting recurring patterns or shift-based risks.
3.  **30 Days**: Monthly strategic overview of governance maturity evolution.

## Technical Implementation

- **Data Source**: The component queries the `/api/dashboard/governance/health-timeline` endpoint.
- **Aggregation**: Data is bucketed chronologically. For large datasets, the API limits results to 1000 points to ensure smooth rendering.
- **Visuals**: Built with `recharts` using an `AreaChart` with smooth interpolation to provide an intuitive pulse of the system's health.

## Executive Interpretation

- **Steady Plateau**: Indicates a mature governance posture with consistent policy enforcement.
- **Intermittent Dips**: Suggest occasional high-risk interactions or policy edge cases that may need investigation.
- **Downward Trend**: Signals degrading AI safety or the introduction of new, high-risk models/agents that are not yet fully governed.

> [!IMPORTANT]
> A health score below 70% for more than 4 hours should trigger a forensic review of the active policy set.
