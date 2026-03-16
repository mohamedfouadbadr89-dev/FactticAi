# FACTTIC ARCHITECTURE DATA FLOW MODEL_v1

## Purpose
This document formally defines the end-to-end data flow within the Facttic governance architecture, ensuring all telemetry, compliance, and application data transitions enforce strict constitutional state rules.

## Architecture Diagram Description
- **API Gateway Layer**: All requests ingest here, with synchronous pre-flight governance telemetry sent out.
- **Facttic Core Engine**: Processes raw metrics against active risk policies.
- **Storage Subsystem**: Asynchronously commits hashed event derivations to Supabase, guaranteeing ledger immutability.

## Data Flow Explanation
1. **Ingestion**: Client payloads securely enter via HTTPS TLS 1.3 endpoints.
2. **Telemetry extraction**: Interceptor strips PII, hashes remaining telemetry, streams to governance engine.
3. **Evaluation**: Local cache checks risk flags. On miss or high uncertainty, queries Supabase RPC deterministic risk scorer.
4. **Resolution**: Final decision state is attached to the ledger and transaction continues or halts.

## VOICE REALTIME GOVERNANCE PIPELINE

Voice Provider
→ `/api/voice/stream`
→ `voice_stream_events`
→ `voiceAnalyzerOrchestrator`
→ numeric risk modifiers
→ `GovernancePipeline`
→ `facttic_governance_events.metadata`

Note: `voice_stream_events` represents time-segmented speech events parsed natively into bounds.


## Evaluation Framework Storage

Tables:
- `evaluation_runs`
- `deployment_configs`
- `audit_logs`
- `facttic_governance_events`

Explain purpose:
- **evaluation_runs** → stores regression and dataset testing results
- **deployment_configs** → controls deployment mode (saas/vpc/self-host)
- **audit_logs** → tracks security and governance actions
- **facttic_governance_events.metadata (jsonb)** → purpose: store voice risk telemetry such as `latency_penalty`, `collision_penalty`, and `barge_in_penalty`.

## Security Implications
- Complete isolation of PII. Facttic only evaluates hashed and structured telemetry.
- Zero-trust default. No transaction is allowed to bypass the interceptor layer.

## Integration Points
- Enterprise identity providers (SAML/OIDC).
- SIEM observability sinks (Datadog, Splunk).

---

## Dashboard Observability Layer

### Overview

Dashboard metrics previously displayed static, hardcoded demo values in React components (e.g., `CountUp value={12847}` for Total Sessions). These values were completely decoupled from the Supabase database, creating a disconnect between the platform's actual operational state and its executive-facing view.

As of this update, executive summary metrics shown in the **Governance Snapshot Card** derive directly from Supabase aggregate queries at page load time.

### Data Sources

| Metric Displayed | Supabase Query |
|---|---|
| **Total Sessions** | `SELECT COUNT(*) FROM sessions` |
| **Governance Events** | `SELECT COUNT(*) FROM facttic_governance_events` |
| **Incidents** | `SELECT COUNT(*) FROM incidents` |
| **Organizations** | `SELECT COUNT(*) FROM organizations` |

### Implementation

The `useSnapshotMetrics` hook (`/lib/dashboard/useSnapshotMetrics.ts`) runs all four queries in parallel using `Promise.all` and the Supabase browser client's `{ count: "exact", head: true }` option — this executes a `COUNT(*)` without fetching any row data, minimizing bandwidth.

```typescript
supabase.from("sessions").select("*", { count: "exact", head: true })
```

### Failure Handling

The layer is designed for graceful degradation:
- If any single query fails, the remaining metrics still render correctly.
- Failed metrics display `—` rather than zero or a stale cached value.
- A skeleton shimmer placeholder renders during the fetch, preventing layout shift.
- All query failures are logged to the browser console with structured context for debugging.

### Structural vs. Live Metrics

Not all values in the Governance Snapshot are DB-derived. The following remain as **structural/editorial values** because they reflect system architecture state rather than DB row counts:

| Row | Reason Remains Static |
|---|---|
| Phase Coverage percentages | Represent architecture completeness, not DB aggregates |
| System Integrity labels (Sealed, AES-256, etc.) | System configuration state, not DB row counts |
| Uptime SLA | Requires external uptime monitoring integration |
| Compliance Score | Derives from multi-table weighted computation (future enhancement) |

---

## Asynchronous Governance Persistence Layer

### Architectural Shift

To achieve massive parallelism (>500 requests/sec) without saturating the Node.js event loop or the Supabase PgBouncer pool, Facttic decouples physical persistence from logical decision-making.

The legacy architecture previously forced `GovernancePipeline.execute()` to block the HTTP response until:
1. PII was deeply stripped via regex across metadata objects.
2. The Database RPC computed the `previous_hash` and SHA-256 links.
3. The Audit logs recorded the action.
4. Websocket telemetry dispatched the broadcast.

This created artificial "jitter" on high-throughput applications like streaming voice, where normal LLM token delivery awaited dense string math.

### The Queue-Driven Model

Under the `v4.1` resilience update, the architecture transitions to an **Asynchronous Persistence Queue** powered by BullMQ backed by Redis:

1. **HTTP Request Ingest**: The prompt hits `GovernancePipeline.execute()`.
2. **Synchronous Evaluation**: `PolicyEvaluator`, `GuardrailDetector`, and `RiskScorer` execute entirely in memory. The risk decision (e.g., `ALLOW`, `BLOCK`) is returned within **sub-10ms** to immediately unblock the requesting client.
3. **Queue Enqueue**: Instead of waiting on the database or network, the pipeline packages the logic results and sanitized payload into `job: { session_id, org_id, decision, risk_score, metadata }` and drops it instantly into `governanceQueue.add()`.
4. **Asynchronous Worker (`governanceWorker.ts`)**: 
    - Picks up the job from Redis automatically.
    - Executes `append_governance_ledger()` and physical hash-chain construction.
    - Writes the required observability logs into `audit_logs`.
    - Handles failure retries and telemetry bounds natively isolated away from the end-user request cycle.

---

## Governance Queue Failure Recovery

### Resilience Guarantees
To prevent the loss of canonical forensic metadata (decisions, risk scores, voice modifiers) if Postgres suffers an outage or RedactPII faults:

1. **Exponential Backoff:** The BullMQ `governanceQueue` applies an automatic exponential backoff retry policy. If `EvidenceLedger.write()` fails, the worker will halt and silently retry the exact payload up to **5 times** at increasing intervals (e.g., 1s, 2s, 4s...).
2. **Dead Letter Queue (DLQ):** If the database is permanently inaccessible and all 5 retries execute and fail, the `governanceWorker` triggers a final exhaustive state (`job.attemptsMade === job.opts.attempts`). 
    Instead of dropping the payload into the ether, the worker catches the exhausted state and shifts the entire JSON job—along with the specific `error_message`—into the `governance_failed_jobs` Postgres table. 
3. **Dashboard Visibility:** The exact count of jobs resting in the DLQ is aggregated in real-time (`SELECT COUNT(*) FROM governance_failed_jobs`) and rendered continuously on the **Governance Snapshot Card** directly under "Failed Events". This allows DevSecOps leaders to identify persistence outages structurally linked to their org infrastructure without digging through internal Redis logs.

### Dead Letter Queue Replay Mechanism
To recover structural integrity when a database outage is resolved, Facttic permits authorized administrators to replay exhausted jobs:

1. **Endpoint Access:** Administrators POST to the protected `/api/admin/replay-failed-governance` API.
2. **Selective Extraction:** The API selects all rows from `governance_failed_jobs` where the `replayed_at` column is `NULL`.
3. **Queue Reinjection:** The exact JSON payloads are cleanly re-enqueued straight back into the BullMQ `governanceQueue` without mutating the payload, ensuring native hash integrity.
4. **Visibility Triage:** Successfully extracted DLQ rows are stamped with a `replayed_at` timezone, removing them from the "Failed Events" dashboard count and incrementing the "Replayed Failed Jobs" metric for clear operational visibility.

### Queue Circuit Breaker

To prevent severe internal retry storms causing localized Redis congestion if the primary Postgres cluster becomes temporarily unavailable, the `governanceWorker` container implements a strict runtime circuit breaker.

If 50 consecutive background jobs fail sequentially, the worker automatically intercepts polling by invoking `worker.pause()`, halting all active message ingestion for 30 seconds. A `QUEUE_CIRCUIT_BREAKER_TRIGGERED` event is logged to infrastructure alerts. After the timeout period, `worker.resume()` is called, allowing the worker to carefully verify if database replication or stability has recovered without mathematically compounding high-velocity retry pressure on the local VNet.

### Queue Backpressure Protection

To protect the Facttic infrastructure from Redis memory exhaustion during sustained database or worker outages, the governance queue implements **volumetric backpressure protection**.

The `governanceQueue.add()` method is wrapped with a depth check that executes before any new job is accepted:
- **Threshold:** 50,000 waiting jobs.
- **Action:** If the queue depth exceeds this threshold, the system throws a `QUEUE_OVERFLOW_PROTECTION` error.
- **Goal:** This prevents the Redis instance from ballooning in size and crashing the entire caching/queuing layer. It forces the upstream API to return a high-pressure failure early, protecting the core platform's stability at the cost of transient event loss during extreme failure states.

Administrators can monitor the `queue_depth` metric to identify when the system is approaching these limits.

### Redis Partition Protection

To protect the background worker pool from cascading failures during Redis network partitions or "Split-Brain" scenarios, the `governanceWorker` implements **adaptive concurrency throttling**.

During high-scale operations, network jitter between the BullMQ container and the Redis instance can cause job retries to overlap with existing executions, leading to CPU storms. 
- **Mechanism:** The worker measures the "ping-to-persistence" duration for every job execution.
- **Trigger:** If the measured latency exceeds **250ms**, the worker characterizes the connection as unstable.
- **Action:** An artificial 500ms delay is injected into the job processor. This effectively collapses the worker's throughput (concurrency) until connectivity stabilizes, preventing the node from over-saturating the partition and giving the Redis cluster headspace to recover.

### Redis Memory Fragmentation Protection

Governance payloads typically involve unredacted user prompts and dense metadata signals, which can reach several hundred kilobytes. To prevent Redis memory fragmentation and premature OOM (Out-of-Memory) states, the Facttic platform applies **GZIP Compression** at the queuing boundary.

1. **Ingress:** `GovernanceQueue.ts` serializes the payload to JSON and compresses it using GZIP before encoding the binary result as Base64 for Redis storage. This reduces the memory footprint of individual jobs by **70-90%**.
2. **Egress:** The `governanceWorker` intelligently detects the `compressed: true` flag in job metadata and decompresses the payload using `zlib.gunzipSync` before moving to integrity verification and persistence. This allows the Redis cluster to store millions of governance events in-flight without triggering aggressive eviction policies.

---

## DATA RETENTION POLICY

Facttic processes multiple categories of operational telemetry and governance data.
To comply with enterprise privacy and regulatory frameworks (GDPR, SOC2, ISO27001), the platform enforces explicit data retention policies.

**Retention rules:**

| Data Category | Retention Period | Purpose |
|---|---|---|
| `voice_stream_events` | 7 days | Short-term troubleshooting and realtime voice physics diagnostics. |
| `voice_transcripts` | 30 days | Post-call governance analysis and incident investigation. |
| `facttic_governance_events` | 365 days minimum | Legal audit trail and compliance verification. |
| `audit_logs` | 365 days minimum | Security, authentication, and administrative traceability. |

Expired records are purged through scheduled maintenance jobs executed by internal background workers.

This policy ensures Facttic stores only the minimum operational data required for forensic governance while protecting customer privacy.

---

## MULTI-REGION FAILURE MODEL

Facttic is architected to tolerate partial infrastructure failures through stateless service design.

### Fast-Path Services (API routes, WebSocket ingestion)
Fast-path services are horizontally scalable and can be deployed across multiple regions.

### Queue Layer
Redis/BullMQ operates in the primary region to guarantee ordering consistency. Queue depth protection prevents memory exhaustion during outages.

### Persistence Layer
The Postgres forensic ledger (`facttic_governance_events`) acts as the canonical source of truth. Read replicas may be distributed geographically, but all hash-chain writes occur in the primary region to preserve deterministic ordering.

### Worker Layer
Background governance workers are stateless containers that can restart in alternate regions without breaking queue processing guarantees.

### Failure Behavior
If the primary persistence region becomes unavailable:
- API ingestion continues temporarily in degraded mode.
- Governance decisions remain available via the fast-path logic engine.
- Ledger writes resume automatically when persistence connectivity returns.

This model preserves the integrity of the forensic ledger while maintaining operational continuity.

