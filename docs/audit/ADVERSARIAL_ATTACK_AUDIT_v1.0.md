# BLACKBOX ARCHITECTURE ATTACK AUDIT
## Adversarial Security & Distributed Systems Forensic Report
**Date**: March 16, 2026
**Target**: Facttic AI Governance Platform
**Classification**: CRITICAL / RED-TEAM SENSITIVE
**Auditor**: Lead Adversarial Analyst

---

## 1. Executive Summary
The Facttic platform currently maintains a **catastrophic security posture**. While the architecture documentation claims "Ultra-Aggressive Hardening" and "Zero-Trust enforcement," the technical implementation contains multiple critical vulnerabilities that allow for complete multi-tenant data exfiltration, forensic ledger forgery, and trivial denial-of-service (DoS) attacks. 

The most severe finding is the **total absence of Row-Level Security (RLS)** on the primary forensic ledger, exposing all customers' private governance data to all other authenticated users.

---

## 2. Attack Surface Map

### 2.1 External Surface
*   **REST API**: `/api/chat`, `/api/voice/telemetry`, `/api/admin/replay-failed-governance` (All authenticated via Supabase JWT).
*   **WebSocket**: `/api/voice/socket` (Authenticated handshake).
*   **Database RPC**: `append_governance_ledger` (Publicly discoverable and executable).

### 2.2 Internal Surface
*   **BullMQ/Redis**: Unsigned internal message bus (theoretical).
*   **Background Workers**: `governanceWorker.ts` processing signed payloads.

---

## 3. Critical Vulnerabilities (Risk: EXTREME)

### 3.1 V-01: Global Multi-Tenant Data Leak (RLS Failure)
*   **Affected Table**: `public.facttic_governance_events`, `public.incidents`, `public.memberships`
*   **Finding**: Row-Level Security (RLS) is **DISABLED** on the primary forensic ledger and incident tables.
*   **Exploit**: Any user with a valid Supabase JWT (standard `authenticated` role) can execute a `SELECT *` on these tables via the Supabase client to exfiltrate the entire history of AI interactions, risk prompt violations, and organizational structures for **all companies** on the platform.
*   **Impact**: Total compromise of customer privacy and intellectual property.

### 3.2 V-02: Forensic Ledger Forgery (RPC Weaponization)
*   **Affected Function**: `public.append_governance_ledger`
*   **Finding**: The function is `SECURITY DEFINER` and granted `EXECUTE` permissions to `anon` and `authenticated` roles. It accepts a `p_secret` argument which defaults to a hardcoded string (`'development_fallback_secret'`).
*   **Exploit**: An attacker can call this RPC directly from the browser, bypassing the `GovernancePipeline` entirely. By providing the victim's `org_id` and the default secret, they can insert fraudulent, cryptographically valid records into the "Forensic Ledger."
*   **Impact**: The "Forensic" nature of the ledger is invalidated. It can no longer be trusted as evidence in audit or compliance scenarios.

### 3.3 V-03: Unauthorized Global DLQ Replay
*   **Affected Route**: `POST /api/admin/replay-failed-governance`
*   **Finding**: The administrative replay endpoint checks for a valid session but **fails to enforce RBAC**.
*   **Exploit**: Any low-privileged "Viewer" user can trigger a global replay of all failed governance jobs across the entire platform. 
*   **Impact**: Operational disruption and potential DoS via queue flooding.

---

## 4. Architecture Fragility & High Risks

### 4.1 H-01: Self-Induced Denial of Service (Adaptive Throttle)
*   **Mechanism**: The `governanceWorker` implements an "Adaptive Throttle" that enters a 500ms sleep if Redis latency exceeds 250ms.
*   **Weakness**: During high load, Redis latency naturally increases. This throttle causes a positive feedback loop: workers sleep -> queue grows -> memory pressure increases -> DB results lag -> Redis slows further.
*   **Result**: A minor spike in traffic can permanently stall the background processing layer.

### 4.2 H-02: Hash Collision Sensitivity in Advisory Locks
*   **Mechanism**: `pg_advisory_xact_lock(hashtext(p_session_id::text))`
*   **Weakness**: `hashtext` collapses a 128-bit UUID into a 32-bit integer.
*   **Result**: At 10,000 concurrent sessions, the probability of hash collisions is high. Unrelated organizations will experience artificial lock contention and latency spikes because their session IDs happen to hash to the same 32-bit bucket.

---

## 5. Architecture Resilience Score

| Category | Score | Notes |
|:---|:---|:---|
| **Security** | 1 / 10 | Catastrophic failure in multi-tenant isolation (RLS). |
| **Architecture** | 4 / 10 | Good sync/async decoupling, but fragile feedback loops. |
| **Scalability** | 3 / 10 | In-memory buffers and hash collisions limit horizontal growth. |
| **Data Integrity** | 2 / 10 | Forensic ledger is trivial to forge via public RPC. |
| **Operational Resilience**| 2 / 10 | "Adaptive Throttle" and lack of RLS make the system brittle. |

---

## 6. Survival Analysis

### 6.1 Would it survive 10,000 concurrent users?
**NO.** The 32-bit advisory lock contention and the massive memory pressure from in-memory WebSocket `sessionBuffers` would likely cause the API pods to OOM or the Database to enter a permanent lock-wait state.

### 6.2 Would it survive 500 voice streams?
**PROBABLY NOT.** While memory allows for it, the `governanceWorker` concurrency is pinned at 20. 500 active streams flushing every 10s would saturate the workers, leading to massive delays in governance decision persistence.

### 6.3 Would it survive a Redis restart?
**NO.** The `GovernancePipeline` lacks a local fallback. If Redis is down, all incoming traffic that requires governance (Chat/Voice) will fail with 500 errors.

---

## 7. Immediate Required Actions (Audit Remediation)
1.  **URGENT**: Enable RLS on `facttic_governance_events`, `incidents`, and `memberships`.
2.  **URGENT**: Revoke `EXECUTE` on `append_governance_ledger` from `anon` and `authenticated`. Limit it to the `service_role` or a specific app principal.
3.  **URGENT**: Remove the default value for `p_secret` in the DB and rotate the production `GOVERNANCE_SECRET`.
4.  **REFACTOR**: Replace in-memory `sessionBuffers` with a Redis-backed state machine for the WebSocket gateway.

---
**END ADVRESERIAL REPORT**
