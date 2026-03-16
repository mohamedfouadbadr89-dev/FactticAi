# Evidence Export Engine

## Overview
The **Evidence Export Engine** enables compliance officers and lead auditors to generate cryptographically signed audit bundles. These bundles aggregate telemetry across the governance, intelligence, and forensics layers, providing a canonical record of system behavior.

## Export Capabilities

### 1. Data Domains
Evidence packages can include any combination of:
- **Governance Ledger**: The sequential chain of all policy triggered events and state changes.
- **Session Replay**: Deterministic reconstruction data for session analysis.
- **Compliance Signals**: Dedicated records of PII detection and sensitive entity exposure.
- **Risk Evaluations**: Historical records of statistical drift and hallucination risks.

### 2. Available Formats
- **JSON**: Machine-readable structured object containing the complete telemetry set.
- **CSV**: Tabular representation of audit events for spreadsheet analysis.
- **PDF**: Pre-formatted, read-only audit certificate (Simulated via high-fidelity structured text).

## Cryptographic Integrity
Every evidence package is hashed using **SHA-256**. The hash is generated from the bundle content combined with a `generated_at` timestamp salt. This fingerprint is:
1. Recorded in the `X-Evidence-Hash` response header.
2. Logged to the `audit_logs` for historical verification.
3. Accessible for offline verification against the platform's verification utility.

## API Integration

### Initiate Export
- **Path**: `POST /api/compliance/export`
- **Body**: 
  ```json
  {
    "org_id": "uuid",
    "types": ["ledger", "compliance"],
    "format": "JSON",
    "date_start": "ISO-TIMESTAMP",
    "date_end": "ISO-TIMESTAMP"
  }
  ```
- **Response**: The physical file stream with integrity headers.

## Dashboard
**Location**: `/dashboard/compliance/export`
Provides an executive interface for configuring and generating on-demand evidence packages.
