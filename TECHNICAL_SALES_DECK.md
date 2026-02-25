# Facttic Technical Sales Deck (v3.3)

## Slide 1: The Isolation Debt Problem
Most SaaS architectures rely on weak application-layer multi-tenancy. Forged headers or broken middleware logic lead to catastrophic data leaks.

## Slide 2: Facttic "Secure by Construction"
- **JWT-Only Identity**: Forged `x-org-id` headers are defeated at the edge.
- **Native RLS**: The database engine, not the code, enforces data boundaries.
- **SHA-256 Idempotency**: Webhooks are uniquely identifiable per tenant, preventing cross-tenant collisions.

## Slide 3: Resilience Architecture
- **Fail-CLOSED Rate Limiting**: Redis counters prevent system degradation during traffic spikes.
- **Predictive Governance**: We detect infrastructure drift (latency/error rate) BEFORE failure occurs.

## Slide 4: Institutional Deployment
- **Single-Tenant VPC**: Isolated DB, Redis, and Object Storage.
- **BYOK (Bring Your Own Key)**: Institutional clients retain physical control of encryption keys.
