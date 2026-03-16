# Governance Event Ledger

## Overview

`facttic_governance_events` is the canonical immutable forensic ledger for every governance pipeline execution. Every row represents a complete governance decision, cryptographically linked to the previous row in the same session via a hash chain. It powers the Incidents Timeline, Control Center Metrics, Simulation Activity, and Forensics dashboards.

## Schema (Current — `facttic_governance_events`)

| Column | Type | Description |
|---|---|---|
| `event_id` | UUID (PK) | Auto-generated unique identifier |
| `session_id` | UUID | Interaction session thread |
| `org_id` | UUID | Organization (multi-tenant isolation) |
| `event_type` | TEXT | `governance_decision`, `governance_evaluation`, `simulation_run`, etc. |
| `prompt` | TEXT | The evaluated prompt (nullable) |
| `decision` | TEXT | `ALLOW`, `WARN`, or `BLOCK` |
| `risk_score` | NUMERIC | Computed risk score (0–100) |
| `violations` | JSONB | Structured policy violation records |
| `guardrail_signals` | JSONB | Raw signals from GuardrailDetector |
| `latency` | NUMERIC | Pipeline execution time in ms |
| `model` | TEXT | AI model identifier |
| `timestamp` | BIGINT | Unix epoch ms (for timeline ordering) |
| `created_at` | TIMESTAMPTZ | Server-side write timestamp |
| `previous_hash` | TEXT | SHA-256 hash of the prior event (or `GENESIS_HASH`) |
| `event_hash` | TEXT | SHA-256 of this event's canonical fields |
| `signature` | TEXT | HMAC-SHA256 of `event_hash` keyed by org secret |
| `metadata` | JSONB | Extended context (voice modifiers, model response, etc.) |

## Insert Layer

All writes flow through `EvidenceLedger.write()` → `append_governance_ledger()` Postgres RPC. This ensures the hash chain fields are computed and inserted **atomically** — the chain link and the row land in the same database transaction.

## Performance Indexes
- `idx_fge_session_id`: Per-session lookups for chain verification and replay
- `idx_fge_org_id`: Per-org event aggregation
- `idx_fge_timestamp`: Chronological ordering for timeline dashboards
- `idx_fge_hash_chain`: Covering index on `(session_id, created_at ASC)` including `event_hash` and `previous_hash` for O(n) chain traversal
- `idx_fge_event_hash`: Point lookups by event_hash during chain verification

## RLS

Authenticated users may `SELECT` only their own organization's events. `INSERT` is restricted to the service role. `UPDATE` and `DELETE` are blocked structurally (append-only by architecture).

---

## Tamper-Evident Governance Ledger

### Design Goal

Every governance decision must be verifiable as unmodified since it was written. An attacker who gains direct database access should not be able to silently alter a decision, risk score, or prompt without breaking a cryptographic chain that can be detected during forensic audit.

### Hash Chain Architecture

The ledger implements a **blockchain-style hash chain** within each session. Every event links cryptographically to the previous event: modifying any field in any event breaks the chain at that point and every descendant event forward.

```
Session: s_abc123
─────────────────────────────────────────────────────────────────────────

  Event 1                     Event 2                     Event 3
  ─────────                   ─────────                   ─────────
  previous_hash               previous_hash               previous_hash
  = "GENESIS_HASH"            = sha256(Event 1 fields)    = sha256(Event 2 fields)
  │                           │                           │
  ▼                           ▼                           ▼
  event_hash                  event_hash                  event_hash
  = sha256(                   = sha256(                   = sha256(
      "GENESIS_HASH" +            event_hash_1 +              event_hash_2 +
      session_id +                session_id +                session_id +
      timestamp +                 timestamp +                 timestamp +
      prompt +                    prompt +                    prompt +
      decision +                  decision +                  decision +
      risk_score +                risk_score +                risk_score +
      violations +                violations +                violations +
    )                           )                           )
  │                           │                           │
  ▼                           ▼                           ▼
  signature                   signature                   signature
  = HMAC-SHA256(              = HMAC-SHA256(              = HMAC-SHA256(
      event_hash,                 event_hash,                 event_hash,
      GOVERNANCE_SECRET           GOVERNANCE_SECRET           GOVERNANCE_SECRET
    )                           )                           )
```

### Canonical Hash Input

The following field concatenation is used for SHA-256 hash computation. **This order is canonical** — any change invalidates all existing chains.

```
sha256(
  session_id        +   // UUID string
  timestamp_ms      +   // Unix epoch in milliseconds (Date.now())
  prompt            +   // Empty string if null
  decision          +   // "ALLOW", "WARN", or "BLOCK"
  risk_score        +   // Numeric as string
  violations_json   +   // JSON.stringify(violations || [])
  previous_hash         // Prior event_hash, or "GENESIS_HASH" for first event
)
```

This field set is implemented identically in three places that must always remain in sync:

| Layer | Location | Function |
|---|---|---|
| Application | `lib/evidence/evidenceLedger.ts` | `buildHashInput()` |
| Application | `lib/governance/governancePipeline.ts` | `computeGovernanceHash()` |
| Database | `append_governance_ledger()` SQL RPC | `v_hash_input` concatenation |

### Three-Layer Verification Model

`verifyLedgerIntegrity()` in `lib/evidence/evidenceLedger.ts` runs three checks per event, in order:

| Check | Detects | Attack Vector |
|---|---|---|
| **1. Chain linkage** | `previous_hash ≠ prior event_hash` | An event was inserted, deleted, or reordered in the chain |
| **2. Replay hash** | Recomputed SHA-256 ≠ stored `event_hash` | Any stored field (prompt, decision, risk_score, violations) was modified after write |
| **3. HMAC signature** | Recomputed HMAC ≠ stored signature | An attacker correctly recomputed SHA-256 after mutation but cannot forge the HMAC without `GOVERNANCE_SECRET` |

Each failure returns a distinct `IntegrityStatus` and `TamperType`:

```typescript
type IntegrityStatus = 'VALID' | 'CHAIN_BROKEN' | 'HASH_MISMATCH' | 'SIGNATURE_INVALID' | 'EMPTY_SESSION' | 'FETCH_ERROR'
type TamperType      = 'INSERTION_OR_DELETION' | 'FIELD_LEVEL_MUTATION' | 'HASH_LEVEL_MUTATION' | null
```

### Dual-Layer Implementation

Hash computation happens at **two layers** independently:

**Application layer** (`EvidenceLedger.write()`):
- Calls `append_governance_ledger()` Postgres RPC
- Receives back `{ event_hash, previous_hash, signature }` from the DB
- Exposes these values to the caller for immediate verification

**Database layer** (`append_governance_ledger()` RPC):
- Fetches `previous_hash` inside the same function call (atomic, no race window)
- Computes SHA-256 via `pgcrypto.digest()`
- Computes HMAC via `pgcrypto.hmac()`
- Performs the INSERT with all fields in a single transaction

**Database-side verification** (`verify_event_chain()` RPC):
- Can be called independently of the application layer
- Runs chain linkage and SHA-256 replay checks entirely in Postgres
- HMAC verification is application-only (requires `GOVERNANCE_SECRET`)

### Genesis Block Convention

The first event in every session uses `previous_hash = 'GENESIS_HASH'` (the string literal). This is the known anchor for chain verification — `verifyLedgerIntegrity()` seeds `expectedPrevHash = 'GENESIS_HASH'` before iterating.

### Tamper-Resistance Properties

| Property | Mechanism |
|---|---|
| **Field mutation detection** | SHA-256 replay check — any changed field produces a different hash |
| **Row insertion/deletion detection** | Chain linkage — a gap or extra event breaks the `previous_hash` pointer |
| **Hash-level forgery prevention** | HMAC-SHA256 keyed by `GOVERNANCE_SECRET` — an attacker cannot forage the HMAC even after correctly recomputing SHA-256 |
| **Race condition prevention** | `previous_hash` is fetched inside the `append_governance_ledger()` RPC in the same DB call — no application-layer race window |
| **Audit trigger integration** | Every INSERT fires `log_governance_event()` trigger, writing a parallel record to `audit_logs` in the same transaction (see `FACTTIC_SECURITY_DATA_PROTECTION_v1.md`) |

---

## Ledger Concurrency Protection

### The Hash-Chain Race Condition

Because the Facttic ledger computes the `previous_hash` dynamically inside `append_governance_ledger()`, it is susceptible to a race condition (chain fork) under high concurrency. If two concurrent transactions execute `get_latest_event_hash(session_id)` at the exact same millisecond before either transaction commits, both transactions will fetch the identical `previous_hash` and fork the semantic chain. 

### Session-Level Serialization (Advisory Locks)

To eliminate chain forking while avoiding massive performance degradation from table-level locks, `append_governance_ledger()` employs **session-level advisory locks**:

```sql
PERFORM pg_advisory_xact_lock(hashtext(p_session_id::text));
v_previous_hash := public.get_latest_event_hash(p_session_id);
```

### Protection Guarantees

1. **Atomic Serialization**: `pg_advisory_xact_lock` creates an exclusive lock bound to the hashed `session_id`. Any concurrent write targeting the *exact same session* inherently blocks and waits for the first transaction to `COMMIT` or `ROLLBACK`.
2. **Deterministic Linear Chains**: By serializing the reads of `get_latest_event_hash()`, we mathematically guarantee that no two events in the same session can ever share the same `previous_hash` (No forks).
3. **No Cross-Session Contention**: Because the lock boundary is strictly scoped to the `hashtext(session_id::text)`, writing to Session A has absolutely zero locking impact on writing to Session B. The system scales linearly to thousands of concurrent active voice streams natively.
4. **Transaction Scoped**: Notice the `_xact_` designation. The lock is automatically released by Postgres the moment the `INSERT` finishes (or fails), requiring no manual unlocking logic or edge-case cleanup.

---

## Ledger Idempotency Protection

### The Duplicate Retry Hazard
In asynchronous architectures, network degradation or temporary database locking can cause the physical `append_governance_ledger()` Postgres execution to succeed, but the HTTP acknowledgment back to the `governanceWorker` container to timeout or fail. 

When this happens, BullMQ assumes the job failed completely and initiates an **exponential backoff retry**. Without idempotency, this second attempt would calculate a second hash, inserting a duplicate record and fracturing downstream dashboard metrics.

### Queue Tracking Idempotency Lock
To guarantee exact-once forensic persistence, Facttic couples the BullMQ workflow to Postgres uniquely via the `queue_job_id` vector:

1. **Schema Extension:** The `facttic_governance_events` table contains a unique `idx_governance_job_id` index mapping explicitly to the optional `queue_job_id` constraint.
2. **Worker Binding:** The `governanceWorker` passes its native, unforgeable `job.id` variable directly into the `EvidenceLedger.write` payload upon fetching.
3. **RPC Idempotency Barrier:** Immediately upon executing `append_governance_ledger()`, before obtaining the session advisory lock or calculating hashes, Postgres executes a `SELECT` checking if the `p_queue_job_id` already exists.
4. **Graceful Returns:** If the `job.id` footprint is matched, Postgres bypasses the insert and directly returns the *existing* JSONB ledger properties (including previously computed hashes and signatures). This allows the BullMQ worker to mark the job as successfully completed without duplicating the chain.
