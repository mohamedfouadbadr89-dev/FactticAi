# Facttic Tiered Pricing Logic

Facttic utilizes a **Deterministic Entitlement Model** to align governance costs with organizational scale. This document explains our Entity Unit (EU) calculation and pricing tiers.

## Entity Unit (EU) Model

To simplify cross-model governance, Facttic normalizes all interactions into **Entity Units (EU)**. This ensures that a complex voice interaction is weighted appropriately against a standard chat session.

### EU Weights
| Interaction Type | EU Weight | Rationale |
| :--- | :--- | :--- |
| **Chat Session** | 1.0 EU | Standard prompt/response cycle with policy intercept. |
| **Voice Minute** | 0.2 EU | Continuous streaming evaluation per 60 seconds. |
| **Manual Evaluation** | 0.5 EU | Human-in-the-loop review of forensic evidence. |
| **Sandbox Run** | 0.1 EU | Simulated interacton for testing policy drift. |

## Pricing Tiers

Facttic offers three primary tiers based on monthly EU capacity.

### 1. Starter Tier
- **Target**: Small teams or pilot projects.
- **Capacity**: 10,000 EU / month.
- **Price**: $29 / month.
- **Features**: Core guardrails, PII detection, Basic analytics.

### 2. Growth Tier
- **Target**: Production-scale AI deployments.
- **Capacity Options**:
    - 50,000 EU: $99 / month.
    - 100,000 EU: $149 / month.
    - 250,000 EU: $249 / month.
- **Features**: Advanced forensics, Drift intelligence, RBAC.

### 3. Scale Tier
- **Target**: Enterprise-wide AI governance.
- **Capacity Options**:
    - 250,000 EU: $299 / month.
    - 500,000 EU: $499 / month.
- **Features**: Service role isolation, Custom policy engines, Full audit immutability.

## Forensics & Billing

Every billing event is recorded in the **Immutable Billing Ledger** (`billing_events`). This ledger is linked to the session-id in the `governance_event_ledger`, providing 100% transparency into why a specific cost was incurred.

> [!TIP]
> Use the **Usage Dashboard** to monitor consumption velocity and prevent automated quota exhaustion.
