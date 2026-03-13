# Governance Monitoring Dashboard

The Governance Monitoring Dashboard provides real-time, read-only visibility into the platform's governance and risk state.

## Dashboard URL: `/dashboard/governance`

### Key Widgets

1.  **Governance Health Score**: Displays the current organizational governance state (SAFE, WATCH, CRITICAL) and the overall risk score.
    - Data Source: `/api/governance/state`
2.  **Model Drift Status**: Shows the latest predictive drift score and escalation level.
    - Data Source: `/api/intelligence/predictive-drift`
3.  **Active Alerts Feed**: A live list of the most recent critical governance incidents.
    - Data Source: `/api/governance/alerts`
4.  **Session Risk Distribution**: Aggregated risk score reflecting the platform's current session safety.
    - Data Source: `/api/governance/risk-score`
5.  **Cost Anomaly Signals**: Real-time monitoring of economic integrity and token spikes.
    - Data Source: `/api/economics/cost-anomalies`

## Technical Details

- **Refresh Interval**: 10 Seconds (Automated)
- **Interaction Mode**: Strict **READ ONLY**. No state-mutating actions are permitted on this view.
- **Responsive Design**: Optimized for multi-device monitoring environments.

## Internal Flow
The dashboard utilizes the `useInterval`-like pattern with `setInterval` to poll the underlying governance APIs every 10 seconds, ensuring that executive and operative views are always synchronized with the platform's autonomous shielding layers.
