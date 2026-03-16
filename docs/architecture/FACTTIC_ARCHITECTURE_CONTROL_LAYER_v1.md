# Control Layer Architecture

The Control Layer transforms Facttic from a dashboard-driven system into a platform-driven system by introducing a unified execution interface for all governance operations.

## Purpose
The Control Layer acts as the single point of entry for all governance evaluations. It ensures that every request is authorized, logged, and executed through the `GovernancePipeline` consistently across all interfaces (Playground, Simulator, Integrations).

## Execution Flow
1. **Request Ingestion**: The API accepts a POST request at `/api/governance/execute`.
2. **Security & RBAC**: The layer verifies the `org_id` and ensures the request is authenticated.
3. **Pipeline Execution**: The request is handed over to the `GovernancePipeline` for orchestration of multiple engines.
4. **Audit Logging**: Every execution event is recorded in the `governance_event_ledger`.
5. **Structured Response**: A unified response is returned containing risk scores, violations, guardrail signals, and ledger IDs.

## API Contract

### Endpoint
`POST /api/governance/execute`

### Request Body
```json
{
  "org_id": "string (required)",
  "prompt": "string (optional)",
  "model": "string (optional)",
  "metadata": "object (optional)",
  "simulation_mode": "boolean (optional)",
  "playground_mode": "boolean (optional)"
}
```

### Response Body
```json
{
  "status": "ok",
  "risk_score": "number",
  "violations": "array",
  "guardrails": "object",
  "alerts": "string",
  "ledger_id": "string",
  "decision": "string",
  "metadata": "object"
}
```

## Security Model
- **RBAC Enforcement**: All requests must be associated with a valid organization and authorized user.
- **Anonymous Rejection**: The Control Layer rejects any requests without a verifiable organization context.
- **Audit Traceability**: Every action is logged with a unique `ledger_id` for forensic analysis.
