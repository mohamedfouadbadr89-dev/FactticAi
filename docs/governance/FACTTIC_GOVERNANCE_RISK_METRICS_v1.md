# Risk Metrics Aggregation

The Risk Metrics Engine synthesizes distributed governance signals into a single, unified organizational risk score.

## Calculation Formula

Risk is calculated using a weighted average across four core governance dimensions:

| Component | Weight | Source Engine |
| --- | --- | --- |
| **Guardrail Risk** | 35% | `GuardrailEngine` |
| **Drift Risk** | 25% | `PredictiveDriftEngine` |
| **Behavior Risk** | 25% | `BehaviorForensicsEngine` |
| **Cost Risk** | 15% | `CostAnomalyEngine` |

**Formula:**
`risk_score = (guardrail * 0.35) + (drift * 0.25) + (behavior * 0.25) + (cost * 0.15)`

## API Usage

### `GET /api/governance/risk-score`

Retrieves the latest organizational risk score and breakdown.

**Parameters:**
- `org_id`: (Required) Organization ID.

**Response Body:**
```json
{
  "risk_score": 42,
  "breakdown": {
    "guardrail_risk": 30,
    "drift_risk": 55,
    "behavior_risk": 40,
    "cost_risk": 20
  },
  "timestamp": "2026-03-05T01:50:00Z"
}
```

## Database Schema: `governance_risk_metrics`

| Column | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Primary Key |
| `org_id` | `uuid` | Scoped Organization ID |
| `session_id` | `uuid` | Optional Session Context |
| `risk_score` | `float` | Aggregated Score (0-100) |
| `signals_json` | `jsonb` | Raw component breakdown |
| `created_at` | `timestamp`| Calculation time |
