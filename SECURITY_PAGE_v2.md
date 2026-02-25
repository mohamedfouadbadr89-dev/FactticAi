# Facttic Security Architecture: Institutional-Grade Isolation

## 1. Multi-Tenant Structural Immunity
Facttic treats organization isolation as a first-order architectural constraint.
- **Protocol**: Identity resolving happens exclusively server-side via JWT `sub` and `org_id` claims.
- **Guardrail**: No client-provided headers are trusted for context resolution.

## 2. Row-Level Security (RLS)
Every byte of data in Facttic is protected by the Postgres RLS engine.
- **Policy**: `USING (org_id = (auth.jwt() ->> 'org_id')::uuid)`
- **Verification**: 100% of audit logs include RLS telemetry to prove zero cross-tenant leakage.

## 3. Defense-in-Depth
- **Infrastructure Chaos**: Automated Resilience testing (Black Swan Simulation) ensures system stability under load.
- **Rate-Limiting**: Global Redis-backed throttling with Fail-CLOSED semantics.
- **Encryption**: AES-256 at rest with BYOK integration capabilities.

## 4. Compliance & Trust
- **SOC2 Type I**: Audit in progress (Target: June 2026).
- **Pentest**: Scheduled quarterly third-party validation.
- **Assurance**: Continuous PRI monitoring with < 2 min escalation SLA.

---
*Facttic is built for the world's most regulated institutions.*
