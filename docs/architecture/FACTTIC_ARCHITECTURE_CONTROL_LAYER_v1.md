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

---

## Governance Pipeline Consolidation

### Overview

Prior to this update, the codebase maintained two parallel governance execution pipelines:

| Pipeline | Location | Version | Status |
|---|---|---|---|
| Legacy Pipeline | `lib/governancePipeline.ts` | v4.3 (485 lines) | ❌ **Archived & Deleted** |
| Modular Pipeline | `lib/governance/governancePipeline.ts` | v2.0 (modular) | ✅ **Canonical** |

### Why the Legacy Pipeline Was Removed

The coexistence of both pipelines created a **split-brain architecture** — a critical risk for a governance enforcement system:

1. **Duplicated execution paths**: Logic changes applied to one pipeline were silently ignored by callers of the other.
2. **Security regression**: The new modular pipeline initially lacked the `org_members` membership check that the legacy pipeline enforced, creating a cross-tenant data access vulnerability (now resolved by the `authorizeOrgAccess` Zero-Trust guard).
3. **Inconsistent audit trails**: Two separate pipelines produced separate `audit_logs` entries, making forensic analysis impossible to consolidate.
4. **Maintenance burden**: Both pipelines required independent updates, increasing the probability of divergence and bugs.

### Canonical Execution Path

All governance evaluations now route exclusively through:

```
lib/governance/governancePipeline.ts
```

This pipeline:
- Enforces Zero-Trust `org_id` verification via `authorizeOrgAccess()` before any logic executes
- Writes to a single `audit_logs` stream for all decisions (`GOVERNANCE_EXECUTION`, `GOVERNANCE_CRASH`, `AUTHORIZATION_FAILURE`)
- Calls modular sub-engines (`PolicyEvaluator`, `GuardrailDetector`, `RiskScorer`, `DriftDetector`, `IncidentCreator`)
- Integrates voice risk modifiers (`voice_latency_ms`, `voice_collision_index`, `voice_barge_in_detected`)

### Migrated Callers

All 9 callers of the legacy pipeline were updated to the canonical path:

| File | Type |
|---|---|
| `app/api/governance/execute/route.ts` | API Route |
| `app/api/governance/evaluate/route.ts` | API Route |
| `app/api/chat/route.ts` | API Route |
| `app/api/system/report/route.ts` | API Route (diagnostic) |
| `app/api/cron/health/route.ts` | API Route (health check) |
| `lib/simulator/simulator.ts` | Internal Service |
| `lib/testing/simulator.ts` | Testing Utility |
| `generateEvidenceBundle.ts` | CLI Diagnostic Script |
| `certifyDeterminism.ts` | CLI Certification Script |
| `test_audit.ts` | CLI Audit Script |

