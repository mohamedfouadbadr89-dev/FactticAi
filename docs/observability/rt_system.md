# Alert Notification System (Real-Time Governance)

The Facttic.ai Alert Notification System provides immediate visibility into critical governance events, security breaches, and model performance anomalies.

## Architecture

Risk Pipeline → Alert Engine (Classification) → Persistence (DB) → Real-Time Dashboard

### Severity Classification

Severity is determined deterministically based on risk metrics or explicitly provided signals:

- **CRITICAL (Score >= 0.7):** Immediate governance breach or high-probability security bypass. Triggers automated escalation.
- **MEDIUM (0.3 <= Score < 0.7):** Moderate drift or suspicious pattern detection. Requires manual audit within 24 hours.
- **LOW (Score < 0.3):** Informational alerts or minor behavioral shifts. Tracked for long-term trend analysis.

## API Reference

### GET `/api/alerts`

Retrieves a chronologically sorted list of recent alerts for the organization.

**Query Parameters:**
- `severity`: (Optional) Filter by `low`, `medium`, or `critical`.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "alert_type": "PII_REDRACTION_FAILURE",
      "severity": "critical",
      "message": "Detection engine bypassed in Session [ID]",
      "created_at": "timestamp"
    }
  ]
}
```

## UI Components

### `AlertPanel.tsx`
The primary visualization widget for alerts. Located in the maintenance/governance sector of the dashboard. Features real-time state polling and severity-based color coding.
