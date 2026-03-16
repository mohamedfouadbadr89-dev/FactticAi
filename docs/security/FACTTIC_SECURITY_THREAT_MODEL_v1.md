# Facttic AI Governance - Threat Model v1
**Target Architecture:** v5.0 (Asynchronous Persistence, Realtime Voice Ingestion)
**Date:** March 2026

## 1. System Boundaries & Trust Zones
The Facttic platform operates across distinct network and execution boundaries. Understanding these zones is critical for assessing lateral movement and escalation surfaces.

### Trust Zone A: Client Applications & Untrusted Ingestion 
*   **Boundary:** Public Web / HTTPS / WSS.
*   **Components:** Client applications, edge routers, API gateways (`/api/chat`, `/api/voice/stream`, `/api/voice/socket`).
*   **Trust Level:** Zero-Trust. All payloads are assumed hostile, malformed, or attempting exhaustion.

### Trust Zone B: Fast-Path Logic Gateway (Node.js)
*   **Boundary:** Internal VPC subnet.
*   **Components:** `GovernancePipeline.execute()`, `PolicyEvaluator`, `RiskScorer`, Memory Buffers.
*   **Trust Level:** Semi-Trusted. Validates RBAC (`authorizeOrgAccess`) and strips initial payloads, but executes untrusted AI prompts against regex engines. Highly susceptible to CPU/Memory exhaustion attacks.

### Trust Zone C: Asynchronous Message Bus
*   **Boundary:** Redis / BullMQ Internal VNet.
*   **Components:** `governanceQueue`, In-flight background job payloads.
*   **Trust Level:** Trusted Platform. However, data resting here is un-signed (currently) and sits in plaintext.

### Trust Zone D: Deep Forensic Persistence & Workers
*   **Boundary:** Background Worker Containers (`governanceWorker`) + Postgres Clusters.
*   **Components:** Evidence Ledger (`facttic_governance_events`), `redactPII`, Dead Letter Queue (`governance_failed_jobs`), HMAC cryptographic derivation.
*   **Trust Level:** Core Infrastructure. Writes here form the immutable legal chain of custody.

---

## 2. Data Flows
1.  **Ingest Flow:** Untrusted Client &#8594; WSS Upgrade &#8594; Auth Verification &#8594; Fast-path Memory Buffer.
2.  **Evaluate Flow:** Memory Buffer &#8594; Policy Regex Engine &#8594; Numeric Risk Scoring (`ALLOW`/`BLOCK`).
3.  **Bridge Flow:** Computed Decision + Raw Prompt &#8594; BullMQ Redis Store.
4.  **Forensic Flow:** BullMQ &#8594; Async Worker &#8594; `redactPII` Execution.
5.  **Serialization Flow:** Redacted Payload &#8594; `append_governance_ledger` (Advisory Lock) &#8594; Hash Chain Hash/HMAC &#8594; Postgres Commit.

---

## 3. Attack Surfaces & Mitigation Mapping

### Threat 1: Voice Stream Exhaustion (OOM DOS)
*   **Vector:** A malicious authenticated tenant initiates a WebSocket connection and streams multi-megabyte `transcript_delta` chunks continuously without any punctuation or pause events.
*   **Risk:** The Node.js fast-path `sessionBuffers` array grows infinitely until V8 Garbage Collection halts, triggering a gateway-wide Out-of-Memory (OOM) crash affecting all active tenants.
*   **Mitigation Requirement:** Implement a hard volumetric circuit-breaker on the socket array (`chunks.length > MAX_CHUNKS` or byte-size limits) to forcefully collapse and flush the buffer into the governance pipeline, bypassing semantic boundaries to protect the container.

### Threat 2: Dead Letter Queue (DLQ) Replay Tampering
*   **Vector:** The worker's 5x exponential backoff exhausts, dropping the fast-path decision (`ALLOW` / `BLOCK`) into the `governance_failed_jobs` table in plain JSONB. An attacker with internal network access alters the JSON payload. An administrator later calls `/api/admin/replay-failed-governance`.
*   **Risk:** The exact modified payload bypasses the fast-path engine, passing directly back to BullMQ and into the immutable ledger. An attacker can forge an `ALLOW` event into the historical hash-chain.
*   **Mitigation Requirement:** The fast-path gateway MUST compute an HMAC-SHA256 signature scoped to the exact outgoing `job.data` payload. The queue and DB hold the signature. The Async Worker MUST verify this signature before `append_governance_ledger` executes.

### Threat 3: Queue Poisoning & Serialization Stalls
*   **Vector:** An attacker sends highly specific prompt payloads designed to trigger catastrophic backtracking in the `redactPII` or `PolicyEvaluator` regex engines, purposefully slowing the BullMQ background worker to a crawl.
*   **Risk:** The BullMQ queue depth grows faster than the workers can process. Redis fills up, triggering eviction or lock-ups. The Fast-path HTTP requests continue to succeed, creating the illusion of operations, while forensic logging completely halts in the background.
*   **Mitigation Requirement:** 
    1.  Apply hard timeouts to the `governanceWorker` job processing wrapper.
    2.  Set a `maxLen` parameter on the Redis Queue, shedding older payloads to the DLQ proactively if Queue Depth hits extreme thresholds, ensuring the persistence node survives.

### Threat 4: Ledger Integrity Modification / DB Hash Fork
*   **Vector:** The BullMQ worker successfully writes to Postgres (`append_governance_ledger`) but the Node process crashes milliseconds later before returning `success: true` to Redis.
*   **Risk:** Redis initiates a retry. The worker runs again, executing `append_governance_ledger` logic, hashing the *exact same* payload onto the end of the chain. This creates a duplicate forensic event and permanently forks the dashboard counts.
*   **Mitigation Requirement:** Implement strong Idempotency. Postgres must enforce a unique constraint, or the `append_governance_ledger` RPC must accept the BullMQ `job.id` and gracefully return the existing `event_id` if that job UUID already exists in the chain.

### Threat 5: Economic Denial of Service (CPU Amplification)
*   **Vector:** An attacker sends extremely large prompt payloads (multiple megabytes) to the governance pipeline.
*   **Risk:** Processing massive strings through the multiple regex passes in `PolicyEvaluator` and `redactPII` triggers exponential backtracking or simply high CPU load, stalling the fast-path for all other users.
*   **Mitigation Requirement:** The system MUST enforce a strict volumetric gate at the ingestion point. All prompts exceeding 16KB (MAX_PROMPT_BYTES) are rejected immediately before any logical evaluation occurs, protecting the container's specialized CPU cycles for legitimate transactions.

---

### Asynchronous Payload Integrity Protection

To comprehensively eliminate the attack vectors associated with DLQ tampering and Redis transit manipulation, the Facttic async architecture enforces strict payload signatures natively:

1. **Fast-Path Cryptography:** Immediately post-risk evaluation, `GovernancePipeline` securely JSON-stringifies the exact background instructions and generates a rigid `HMAC_SHA256` signature utilizing the container's isolated `GOVERNANCE_SECRET`.
2. **Unified Transit Object:** The `job.data` footprint traversing BullMQ contains strictly `{ payload, signature }`.
3. **Pre-commit Worker Verification:** Before invoking `redactPII` or connecting to the Postgres layer, `governanceWorker.ts` independently recomputes the target `HMAC_SHA256` value. Structural mismatch throws an instant `QUEUE_PAYLOAD_TAMPERED` error routing securely to `audit_logs`.
4. **Secure DLQ Replays:** `governance_failed_jobs` now maintains a `signature` column parallel to the raw payload. The API replay route securely extracts and re-injects this exact signature back into BullMQ, preserving unforgeable validity strictly tied to the original HTTP context.

---

## INCIDENT SEVERITY MODEL

Facttic governance violations are classified into standardized severity tiers to ensure predictable response behavior across all organizations.

| Severity | Examples | Action |
|---|---|---|
| **LOW** | Minor latency anomalies, minor sentiment drift, non-critical hallucination signals | Event logged into `facttic_governance_events`. |
| **MEDIUM** | Repeated guardrail violations, minor prompt injection attempts, policy misalignment warnings | Incident created and surfaced within the governance dashboard. |
| **HIGH** | PII exposure attempts, confirmed prompt injection attacks, data exfiltration indicators | Governance engine escalates decision to **BLOCK** and records the incident. |
| **CRITICAL** | Cross-tenant access attempt, credential leakage, system integrity compromise | Immediate transaction termination, alert emission, and security event written to `audit_logs`. |

---

## Conclusion
The Facttic asynchronous architecture effectively insulates the fast-path HTTP ingestion from database latency jitter. However, the introduction of intermediate temporal storage (Redis/BullMQ & DLQ) expands the data-tampering attack surface. The system is fundamentally secure against external Tenant manipulation provided the **Voice Stream OOM** limitation and **DLQ Payload Integrity Signatures** are operationalized prior to General Availability.
