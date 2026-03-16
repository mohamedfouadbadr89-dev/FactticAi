# Data Governance Layer

## Overview
The **Data Governance Layer** is responsible for enforcing institutional compliance through deterministic data retention policies and right-to-erasure (GDPR) workflows. It provides a centralized mechanism for managing the lifecycle of intelligence data across Facttic.ai.

## Architecture

### 1. Data Retention Engine
The `DataRetentionEngine` enforces time-based data expiration.
- **Components**: `lib/governance/dataRetentionEngine.ts`
- **Logic**: 
    - Scans registry tables (`conversation_timeline`, `incident_responses`, `model_behavior`).
    - Applies organization-specific retention windows defined in `data_retention_policies`.
    - Automatically purges expired records during scheduled scans.
- **Audit**: All cleanup operations are logged in the `FACTTIC` audit log.

### 2. GDPR Erasure Engine
The `GdprEraseEngine` coordinates the complete removal of session-related data.
- **Components**: `lib/governance/gdprEraseEngine.ts`
- **Scope**: Coordinated deletion across:
    - `sessions`
    - `conversation_timeline`
    - `evaluations`
    - `messages`
    - `session_turns`
    - `governance_snapshots`
    - `governance_root_cause_reports`
- **Tracking**: All requests are recorded in `gdpr_erasure_requests` for compliance verification.

## API Integration

### Initiate Erasure
**Endpoint**: `POST /api/governance/gdpr-erase`
**Authentication**: Bearer Token (Admin/Owner role required)
**Payload**:
```json
{
  "session_id": "uuid-of-session"
}
```

## Dashboard Interface
Access the Data Governance dashboard at `/dashboard/data-governance`.
- **Retention View**: Real-time visibility into active table retention windows.
- **Erasure Trigger**: Administrative interface for executing right-to-erasure requests.
- **History Registry**: Immutable audit trail of all processed erasure requests.

## Compliance Guarantee
- **Deterministic Purge**: Once executed, session data is completely removed from all linked intelligence engines.
- **Privacy by Design**: Retention policies ensure that PII and sensitive behavioral data do not persist longer than required by institutional mandates.
