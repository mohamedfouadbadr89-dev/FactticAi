# Unified Governance Evaluation API

The Unified Governance Evaluation API provides a single entry point for orchestrating the entire Facttic governance stack. It aggregates signals from interceptors, custom policies, deep safety guardrails, and risk/state engines.

## Endpoint: `POST /api/governance/evaluate`

Orchestrates a comprehensive governance check for a given AI interaction.

### Request Body
```json
{
  "org_id": "uuid",
  "session_id": "uuid",
  "prompt": "User query...",
  "response": "AI response..."
}
```

### Aggregation Pipeline
1.  **AI Interceptor Kernel**: Initial PII redaction and prompt injection check.
2.  **Guardrail Engine**: Deep analysis of response for hallucination, safety, and tone.
3.  **Policy Engine**: Evaluation against organization-specific governance rules.
4.  **Risk Metrics Engine**: Weighted aggregation of all subsystem signals.
5.  **Governance State Engine**: Final determination of the organizational state (e.g., SAFE, WATCH, CRITICAL).

### Response Body
```json
{
  "decision": "BLOCK | WARN | ALLOW",
  "risk_score": 42,
  "governance_state": "SAFE",
  "violations": [
    {
      "policy_name": "Strict Privacy",
      "rule_type": "pii_exposure",
      "threshold": 0.5,
      "actual_score": 0.8,
      "action": "block"
    }
  ],
  "signals": {
    "guardrail": {
      "hallucination_risk": 0.1,
      "safety_risk": 0.05,
      ...
    },
    "risk_breakdown": {
      "guardrail_risk": 20,
      "drift_risk": 40,
      ...
    }
  },
  "metadata": {
    "latency_ms": 142
  }
}
```

## Security
- **Org Isolation**: Strict `org_id` filtering is enforced at every stage of the pipeline.
- **Fail-Safe**: If an internal engine fails, the aggregator logs the incident and returns a 500 status to prevent unauthorized proceeds under uncertain conditions.
