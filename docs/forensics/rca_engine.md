# Root Cause Analysis (RCA) Engine

The RCA Engine provides deterministic forensic attribution for AI sessions that exhibit high risk, policy violations, or model drift.

## Methodology

The engine identifies the **Root Cause** by reconstructing the session timeline and identifying the first "causal anomaly."

### Causal Anomalies
An event is considered a causal anomaly if it meets any of the following criteria:
1. **Model Drift Alert:** A significant shift in model behavior metrics.
2. **Policy Violation:** Direct breach of security or safety guardrails.
3. **Risk Spike:** Any intervention or interaction with an incremental risk score > 60%.
4. **Governance Escalation:** Manual or automated escalation event.

### Failure Chain Reconstruction
Once a root cause is identified, the engine builds a **Failure Chain** consisting of all subsequent events in the session. This provides auditors with a clear path of how the initial anomaly cascaded into a high-risk state.

## API Reference

### GET `/api/forensics/rca/[sessionId]`

Returns the RCA report for a specific session.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "root_event": {
      "timestamp": "iso-date",
      "event_type": "drift_alert | policy_violation | risk_spike",
      "content": "string",
      "risk_score": 75
    },
    "failure_chain": [...],
    "policy_triggers": [...],
    "risk_peak": 88,
    "causality_type": "drift"
  }
}
```

## UI Integration

The RCA report is surfaced in the **Session Inspector** via the **Root Cause Attribution** drawer. 

- **Root Cause Summary:** Highlights the primary trigger at the top of the interface.
- **Failure Chain Visualizer:** Shows the chronological collapse of session integrity.
