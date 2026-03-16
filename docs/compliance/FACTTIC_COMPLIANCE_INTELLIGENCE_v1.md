# Compliance Intelligence Engine

## Overview
The **Compliance Intelligence Engine** is a dedicated security layer within Facttic.ai that monitors for sensitive data exposure in real-time. It identifies Personally Identifiable Information (PII) and institutional secrets before they are permanently logged or propagated.

## Core Capabilities

### 1. PII Detection Strategy
The engine utilizes high-fidelity regex patterns curated from `lib/redactor.ts` to scan interaction content:
- **Financial**: Credit Cards (Luhn-compliant), IBANs.
- **Identity**: Passport Numbers, SSNs, Government IDs.
- **Contact**: Emails, Verified Phone Numbers.
- **Infrastructure**: IP Addresses, Auth Tokens.

### 2. Risk Scoring Methodology
Risk is computed as a weighted composite score (`compliance_risk_score`):
- **CRITICAL (40 pts)**: Credit Cards, Passports, Government IDs.
- **HIGH (20 pts)**: Emails, Phones, SSNs.
- **MODERATE (10 pts)**: IP Addresses, Non-verified identifiers.

The score is capped at **100**. A score above **60** triggers an immediate `COMPLIANCE_RISK` signal to the `Autonomous Governor`.

### 3. Entity Tracking
Detected entities are stored as a JSONB payload (`sensitive_entities`) in the `compliance_signals` table, recording the frequency and type of exposure for forensic auditing.

## Signal Propagation
- `PII_DETECTED`: Boolean flag triggered on any match.
- `COMPLIANCE_RISK`: State-based alert when the risk score exceeds predefined thresholds.

## Database Integration
**Table**: `public.compliance_signals`
Records are linked to `sessions` and `organizations` for multi-tenant reporting.

## API Usage
**Path**: `GET /api/compliance/signals`
**Access**: Requires Org Admin or Lead Auditor role.
