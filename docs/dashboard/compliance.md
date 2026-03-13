# Compliance Dashboard

## Overview
The Compliance Dashboard (`/dashboard/compliance`) provides a real-time surveillance interface for PII (Personally Identifiable Information) detection and governance adherence. It aggregates signals from the `ComplianceIntelligenceEngine` and the `GovernanceLedger` to provide a unified view of organizational risk.

## Data Flow
1.  **Detection**: `ComplianceIntelligenceEngine` scans session responses for PII (emails, credit cards, phones, etc.) during the governance pipeline execution.
2.  **Persistence**: Signals are persisted to the `compliance_signals` table, and significant events are recorded in the tamper-proof `governance_event_ledger`.
3.  **Aggregation**: The dashboard fetches this data via the Compliance APIs, applying `org_id` isolation.
4.  **Visualization**: Raw signals are transformed into trend lines (PII Risk Heatmap) and frequency distributions (Sensitive Entity Frequency).

## Widgets
- **PII Surveillance Header**: Displays the status of the compliance engine (Live v2.1) and system mode.
- **Hero Metrics**:
    - **Exposed Sessions**: Total count of sessions where PII was detected.
    - **Compliance Health**: 100% minus the average compliance risk score.
    - **Signal Velocity**: Total number of compliance signals processed.
    - **Ledger Depth**: Number of tamper-proof audit blocks in the organization's ledger.
- **PII Risk Heatmap**: A time-series line chart showing the compliance risk score trajectory over recent sessions.
- **Sensitive Entity Frequency**: A categorical bar chart visualizing which types of sensitive data (e.g., Email, Credit Card) are most frequently detected.
- **Governance Ledger Feed**: A real-time stream of low-level governance events from the immutable ledger.
- **Automated PII Safeguards**: Status panel for enforcement actions and gateway integration.

## APIs
- `GET /api/compliance/signals`: Fetches raw PII detection data filtered by `org_id`.
- `GET /api/compliance/ledger`: Retrieves the sequential audit chain from the `governance_event_ledger`.
- `POST /api/compliance/export`: Generates cryptographic evidence bundles for external audits.

## Security & Privacy
- **Org Isolation**: All database queries are strictly constrained by the `org_id` context.
- **Data Protection**: Session IDs are tokenized before being displayed in compliance logs to prevent identity correlation.
- **Immutable Ledger**: Every governance event is cryptographically linked to the previous block, ensuring evidence cannot be deleted or modified without breaking the chain.
