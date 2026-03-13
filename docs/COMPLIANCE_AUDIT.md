# Facttic Security Audit & Compliance Walkthrough
This document outlines the validation procedures executed against Facttic's isolation mechanisms required for SOC 2 and GDPR compliance testing.

## Scenario 1: Data Localization (Data Residency)
**Objective**: Ensure data mapped to European organizational footprints never enters US datacenters during persistence. 
**Verification Flow**:
1. Seed the integration environment with an Organization explicitly tagged `eu-central-1` within `public.organizations`.
2. Generate a mock voice ingestion payload through `/api/webhooks/voice`.
3. Intercept the Edge Routing Layer logic.
   - **Expectation**: Request should correctly route to the `api.eu.facttic` domain endpoint.
   - **DB Check**: Run `SELECT region FROM voice_conversations WHERE id = ?`. The physical disk path should reside within the EU container allocation.
4. **Pass/Fail**: Automated tests in `src/api/webhooks/routing.test.ts` assert this boundary correctly natively.

## Scenario 2: Zero-Knowledge Data Encryption (BYOK)
**Objective**: Confirm raw user data is unintelligible physically on-disk without the Customer Supplied Key.
**Verification Flow**:
1. Connect via super-admin directly to the Postgres database.
2. Query `SELECT raw_data FROM voice_conversations LIMIT 1;`.
3. **Expectation**: Payload must return base64 AES-256 ciphertext format containing no plaintext PII or recognizable context. Decryption without the 256-bit Header Key mapped locally must fail universally.

## Scenario 3: Immutability of Tenant Configurations
**Objective**: Guarantee that Org Admins overrides are logged transparently and cannot be maliciously un-audited.
**Verification Flow**:
1. Change an organization's Data Retention timeframe from 180 to 90 days.
2. Ensure the `tenant_configs` property resolves to `90`.
3. **Expectation**: The `tenant_config_versions` audit log table must organically trigger producing an identical immutable mapping attributed strictly to the modifying user's UUID. Attempting to run `DELETE FROM tenant_config_versions` natively under application credentials must strictly throw a `42501 Insufficient Privilege` RLS error.
