# Facttic — B2B AI Infrastructure & Governance
**Enterprise-Grade Guardrails. Immutable Evidence Ledger. 50ms Deterministic Gate.**

Verified against Live Supabase Production on March 19, 2026.

---

## 🏗️ Technical Architecture (The Engine)

Facttic is a **Fail-Closed AI Governance Platform** designed for high-stakes enterprise environments (Financial Services, Healthcare, Defense). Unlike simple API wrappers, Facttic enforces a hard-coded security floor at the infrastructure level.

### 🛡️ Core Pillars

1.  **Fail-Closed Runtime**: The `GovernancePipeline` (lib/governance) enforces a **50ms latency budget**. If a security check lags, the system blocks the request rather than bypassing the safety gate.
2.  **Immutable Evidence Ledger**: Every interaction is cryptographically hashed into an **SHA-256 chain** (`facttic_governance_events`). The `previous_hash` dependency ensures that tampering with any past record invalidates the entire audit trail.
3.  **Triple-Normalization Layer**: Security analyzers use **Unicode NFKD normalization**, **Base64 trial-decoding**, and **Alphanumeric stripping** to expose semantic intent and bypass obfuscated injections.
4.  **Voice Engine Upgrade (v5.0)**: Real-time telemetry monitoring with **True Latency Clock-Sync** and a hardware-level **Kill-Switch Signal**.

---

## 🚀 Voice Engine Capabilities

| Feature | Implementation | SLA / Threshold |
| :--- | :--- | :--- |
| **Clock-Sync Latency** | `True Latency = Date.now() - client_sent_at` | < 150ms |
| **Kill-Switch** | 85+ Risk Score triggers `INTERRUPT` | < 10ms Signal |
| **Barge-In Escalation** | 3+ session interrupts → +25 Risk Bump | Instant |
| **Atomic Ledger** | 30ms Budget for SHA-256 persistence | 100% Integrity |

---

## 🛠️ Stack & Infrastructure

- **Frontend**: Next.js 15, Vercel, Tailwind CSS.
- **Backend**: Supabase (Postgres + RPC + PG_Crypto).
- **Security**: SHA-256, HMAC-SHA256, Zero-Trust Auth.
- **Monitoring**: Real-time Telemetry Feed & Incident Timeline.

---

## 📄 Documentation Index

- [Governance Pipeline Specification](docs/governance/FACTTIC_GOVERNANCE_PIPELINE_RUNTIME_v1.md)
- [Database & Evidence Ledger Schema](docs/database/GOVERNANCE_SCHEMA_V1.sql)
- [API & SDK Guidelines](docs/api/FACTTIC_API_SDK_NODE_v1.md)

---
© 2026 Facttic AI. All rights reserved.