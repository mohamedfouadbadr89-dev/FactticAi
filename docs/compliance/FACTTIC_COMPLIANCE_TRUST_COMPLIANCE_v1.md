# Trust & Compliance Layer (v3.3)

## Security & Compliance Overview
Facttic is built on a "Secure by Construction" architecture. 

### 1. Data Sovereignty
- **JWT-Only Resolution**: We never trust client-side organization headers. Identity is verified via signed asymmetric tokens.
- **RLS Native**: Row Level Security is active on 100% of tables, ensuring zero cross-tenant visibility at the database engine level.

### 2. Infrastructure Resilience
- **Redis Fail-CLOSED**: Our rate-limiters fail into a protected state, prioritizing system integrity over availability.
- **VPC Deployment**: Enterprise clients can deploy isolated instances with dedicated encryption keys (BYOK).

---

## SOC2 Type I Roadmap
Facttic is on trajectory for SOC2 Type I certification.

| Milestone | Status | Timeline |
|-----------|--------|----------|
| Multi-Tenant Hardening (v3.0) | **COMPLETE** | Feb 2026 |
| Predictive Governance (v3.1) | **COMPLETE** | Feb 2026 |
| Institutional Access (v3.2) | **COMPLETE** | Feb 2026 |
| Readiness Assessment | IN PROGRESS | March 2026 |
| Gap Remediation | PLANNED | April 2026 |
| Auditor Engagement | PLANNED | May 2026 |
| Final Type I Report | TARGET | June 2026 |
