# Facttic AI Governance - System State Snapshot v5
**Timestamp:** Pre-Aggressive Audit Verification  
**Architecture Version:** v4.2 to v5.0 (Asynchronous Paradigm)  

## 1. Active Modules
The fast-path HTTP runtime strictly limits itself to in-memory, pure logic evaluations to guarantee sub-10ms logic resolution:
*   **PolicyEvaluator:** Pattern regex matching and structural rule execution.
*   **GuardrailDetector:** Off-topic limits and prompt injection defense evaluations.
*   **RiskScorer:** Numeric weight combination resulting in `ALLOW`, `WARN`, or `BLOCK` states.
*   **DriftDetector:** Historical comparative calculations checking rolling session context.
*   **IncidentCreator:** Escalation thresholds for high-severity violations.
*   **VoiceAnalyzerOrchestrator:** Advanced streaming physics evaluations covering latency delays, barge-in interruptions, and collision patterns.

## 2. Queue Architecture
Designed to shield the underlying PgBouncer and Postgres clusters from concurrent multi-tenant workload spikes:
*   **Technology:** BullMQ backed by `ioredis`.
*   **Queue Target:** `governance_event_job`.
*   **Resilience:** Default job configuration invokes an exponential backoff retry policy (5 maximum attempts delayed by `1000ms`, `2000ms`, `4000ms`, etc.).
*   **DLQ Backup:** Unrecoverable persistence jobs are transferred silently to `governance_failed_jobs` to protect forensic telemetry from Redis eviction.

## 3. Ledger Pipeline
The immutability chain ensures every model execution remains fully verifiable historically without dragging down UX latency:
*   **Phase 1 (Sync):** The HTTP `GovernancePipeline.execute()` receives the request, evaluates Zero-Trust RBAC, runs the core modules, and immediately enqueues the `job payload` into BullMQ.
*   **Phase 2 (Async Processing):** The `governanceWorker` fetches the job. Runs massive regex (`redactPII`) over strings, securely decoupling V8 event loop jitter.
*   **Phase 3 (DB Serialization):** Reaches `EvidenceLedger.write()` which internally calls the `append_governance_ledger` Postgres RPC. To guarantee ordered hash-chains organically under multi-thread concurrency, the RPC utilizes a `pg_advisory_xact_lock(hashtext(session_id))` locking mechanism natively scoped to the session, avoiding global serialization stalling.

## 4. Voice Ingestion
Real-time integration shifting from traditional continuous HTTP POST boundaries to isolated stateful ingestion:
*   **Endpoint:** `/api/voice/socket/route.ts` (WebSocket Upgrade).
*   **Access Control:** Authentication and DB Session resolution are verified precisely *once* during the HTTP Handshake Phase.
*   **In-Memory Buffering:** Active `transcript_delta` segments and temporal coordinates (`start_ms`/`end_ms`) gather inside a memory Map.
*   **Semantic Triggering:** Bypasses processing physics until an auditory boundary `(.,?,!)` or a static pause metric `(1500ms)` is observed. Upon meeting the trigger, the buffer collapses into an aggregate call towards the primary Governance Fast-Path.

## 5. Database Tables
*   `facttic_governance_events`: The primary forensic ledger storing the immutable risk scores, decisions, cryptography headers (`event_hash`, `signature`), and sanitized `metadata`.
*   `audit_logs`: Technical observability capturing worker execution, pipeline crash states, and authorization violations.
*   `incidents`: Actionable high-priority risk alarms surfaced for compliance officers.
*   `governance_failed_jobs`: The DLQ holding fully-exhausted JSON payloads. Capable of being triaged through `replay_at` mutations via the admin UI.
*   `voice_sessions` & `voice_stream_events`: The native chronological voice streaming records.
*   `governance_policies`: Organization-level logic restrictions.
*   `org_members` & `organizations`: The Zero-Trust identity resolution graph tying users reliably to their enterprise domains.

## 6. Worker Topology
*   **Process Layout:** `workers/governanceWorker.ts` serves as the independent physical daemon picking off logical risk decisions from the gateway tier.
*   **Responsibilities:** 
    * Deep-nested Object Redaction (`redactPII`)
    * Supabase Postgres Hash Chain Interoperability (`EvidenceLedger.write`)
    * Incident Write Persistence
    * Real-time Observability Broadcasting (`/realtime/v1/api/broadcast`)
    * Safe Dead Letter Queue Transfer on failure exhaustion.
