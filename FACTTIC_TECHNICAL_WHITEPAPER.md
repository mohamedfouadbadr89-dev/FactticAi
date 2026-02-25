# Facttic: The Institutional Architecture for AI Governance (v3.8)

## Executive Summary
Facttic is an enterprise-grade governance engine designed to mitigate structural risk in multi-tenant AI systems. This whitepaper details the core pillars of our "Structural Immunity" architecture.

## 1. The Immutable Core (v3.0)
Facttic's security is anchored in a locked constitutional core:
- **JWT-Only Identity**: Every request resolves identity strictly from cryptographically signed JWT claims (`org_id`, `role`).
- **RLS Enforcement**: Every database table is protected by Row-Level Security (RLS) policies that are logically invisible to the application code.

## 2. Deterministic Billing
Facttic solves the "Race Condition Billing" problem in high-concurrency SaaS:
- **Atomic Operations**: All consumption events are recorded via SQL `INSERT ... ON CONFLICT` with cryptographic event hashes.
- **Fail-CLOSED Limits**: Rate-limiters are synced via a global Redis layer that defaults to "CLOSED" (deny access) upon infrastructure failure.

## 3. Tier 2: Predictive Governance (PRI)
The Predictive Risk Index (PRI) utilizes weighted drift detection:
- **Baseline Modeling**: System behavior is compared against a rolling 7-day statistical baseline.
- **Early Warning**: PRI identifies "Silent Drift" (e.g., latency anomalies) before they breach SLAs.

## 4. Institutional VPC & BYOK
Facttic supports isolated single-tenant deployments:
- **VPC Isolation**: Complete database and cache isolation for tier-1 institutions.
- **BYOK**: Bring Your Own Key (BYOK) support for per-tenant encryption key rotation.

## 5. Conclusion
Facttic isn't just a governance tool—it's a verifiable, self-healing substrate for the next generation of institutional AI.
