# Facttic Testing Strategy v1

## Governance Engine Test Coverage

The governance core is safeguarded by strict unit tests aiming for a minimum 80% coverage across `/lib/governance/`, `/lib/security/`, and `/lib/evidence/`. These tests guarantee deterministic behaviour and prevent regressions.

Key automated test components include:

- **Governance Pipeline:** Ensures `GovernancePipeline.execute()` explicitly rejects executions missing a valid `user_id`, maintaining Zero-Trust strictness.
- **Zero-Trust Authorization:** Confirms `authorizeOrgAccess()` checks pass for verified human users, correctly throw `CROSS_TENANT_ACCESS_DENIED` for unauthorized users, and allowlist bypasses work seamlessly for System Principals (`system-cron-health`, `system-diagnostic`, `system-simulator`).
- **PII Redaction:** `redactPII()` is verified against rigorous patterns masking emails, phone numbers, API keys, and JWT tokens across deeply nested objects while avoiding corruption of operational telemetry (strings/numbers).
- **Hash Chain Integrity:** Cryptographic ledger verifications are simulated to guarantee chained hashes (`event2.previous_hash === event1.event_hash`) remain unbroken.
- **Ledger Tamper Detection:** Metadata manipulation is systematically simulated to prove `verify_event_chain()` accurately flags tampered states, catching both mutated entries and altered chain lineages.
