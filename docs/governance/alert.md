# Governance Alert Engine

The Governance Alert Engine is an asynchronous service that monitors critical platform events and generates alerts based on predefined triggers.

## Alert Triggers

| Trigger | Threshold / Condition | Severity |
| --- | --- | --- |
| **Critical Risk Breach** | `risk_score > 75` | `critical` |
| **Policy Violation** | `action === 'block'` | `critical` |
| **Predictive Drift** | `escalation === 'critical'` | `warning` |
| **Cost Spike** | `cost_spike_ratio > 3` | `critical` |

## API Specification

All endpoints enforce strict `org_id` isolation.

### `GET /api/governance/alerts`

Retrieves a list of the 50 most recent alerts for an organization.

**Query Parameters:**
- `org_id`: (Required) Organization ID.

**Response Body:**
```json
[
  {
    "id": "uuid",
    "org_id": "uuid",
    "alert_type": "RISK_SCORE_CRITICAL",
    "severity": "critical",
    "metadata": {
      "score": 82,
      "breakdown": { ... }
    },
    "created_at": "2026-03-05T01:57:00Z"
  }
]
```

## Internal Architecture

The `GovernanceAlertEngine` utilizes `setImmediate` to ensure that alert persistence never blocks the main governance pipeline or critical execution paths.

- **Engine Location**: `lib/governance/alertEngine.ts`
- **Database Table**: `governance_alerts`
