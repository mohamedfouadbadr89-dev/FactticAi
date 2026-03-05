# Governance Policy Management

This document details the lifecycle and management of governance policies within the Facttic AI platform.

## Policy Lifecycle

1.  **Draft**: Policies are created via the management API but can be marked as inactive.
2.  **Active**: Policies are evaluated in real-time by the `PolicyEngine`.
3.  **Updated**: Changes to thresholds or rules result in a version increment.
4.  **Archived**: Policies are soft-deleted (`is_active: false`) to preserve historical audit integrity.

## API Specification

All endpoints enforce strict `org_id` isolation.

### `POST /api/governance/policies/create`
Creates a new governance policy.

**Request Body:**
```json
{
  "org_id": "uuid",
  "policy_name": "Antigravity Protection",
  "rule_type": "pii_exposure",
  "threshold": 0.8,
  "action": "block"
}
```

### `GET /api/governance/policies`
Lists all active policies for an organization.

**Query Parameters:**
- `org_id`: (Required) Organization ID.

### `PATCH /api/governance/policies/update`
Updates an existing policy and increments its version.

**Request Body:**
```json
{
  "id": "uuid",
  "org_id": "uuid",
  "threshold": 0.9
}
```

### `DELETE /api/governance/policies/archive`
Soft-deletes a policy.

**Request Body:**
```json
{
  "id": "uuid",
  "org_id": "uuid"
}
```

## Database Schema

| Column | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Primary Key |
| `org_id` | `uuid` | Owner Organization |
| `policy_name` | `text` | Human-readable name |
| `rule_type` | `text` | Evaluation rule (e.g., `pii_exposure`) |
| `threshold` | `float` | Sensitivity threshold (0.0 - 1.0) |
| `action` | `text` | Action: `warn` \| `block` \| `escalate` |
| `version` | `integer` | Incremental change version |
| `is_active` | `boolean` | Soft-deletion flag |
| `created_at` | `timestamp`| Creation time |
