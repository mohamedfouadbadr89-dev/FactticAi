# Incident Timeline

## Overview
The Incident Timeline provides chronological forensic reconstruction of governance events from the immutable `governance_event_ledger`. Events are grouped by `session_id` to provide a thread-based view of AI interaction sessions.

## Data Source
All incident data is sourced from the `governance_event_ledger` table using the `IncidentService` (`lib/forensics/incidentService.ts`).

### Query
```sql
SELECT
  session_id,
  timestamp,
  decision,
  risk_score,
  signals,
  latency_ms,
  simulation_id
FROM governance_event_ledger
WHERE organization_id = $org_id
ORDER BY timestamp DESC
LIMIT 100
```

## Session Grouping
Events are grouped by `session_id` into incident threads. Each thread includes:
- **session_id**: The unique session identifier.
- **severity**: Calculated from the highest risk score in the thread (Critical > 75, Warning > 50, Normal otherwise).
- **events**: Array of individual governance events.
- **startTime**: Timestamp of the earliest event in the session.

## Event Fields
Each event in the timeline displays:
| Field | Description |
|-------|-------------|
| `session_id` | Session thread identifier |
| `risk_score` | Numeric risk level (0-100) |
| `decision` | ALLOW, WARN, or BLOCK |
| `timestamp` | Time of occurrence |
| `signals` | Detection engine signal types |
| `latency_ms` | Pipeline execution latency |
| `simulation_id` | Non-null if from Simulation Lab |

## API Endpoint
**GET** `/api/forensics/incidents?org_id=<org_id>`

Returns grouped incident threads with severity classification.
