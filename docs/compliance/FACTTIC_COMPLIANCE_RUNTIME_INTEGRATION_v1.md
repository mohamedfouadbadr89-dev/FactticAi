# Compliance Intelligence Runtime Integration

## Overview
The `ComplianceIntelligenceEngine` is a critical security layer within the Facttic Governance Pipeline (v4.3). It performs real-time PII scanning and compliance risk assessment for every AI-generated response.

## Pipeline Integration Point
The engine is hooked into the `GovernancePipeline.execute` method following the stochastic analysis phase:

1.  **Interceptor Layer (Prompt)**
2.  **Guardrail Layer (Response Analysis)**
3.  **Compliance Intelligence (Analysis) <-- RUNTIME HOOK**
    - High-velocity scanning for PII (Regex-based).
    - Asynchronous persistence to `compliance_signals`.
4.  **RiskMetricsEngine (Aggregation)**
5.  **GovernanceStateEngine (Cluster Stability)**

## Data Persistence
Signals are written to the `compliance_signals` table with the following structure:

| Field | Type | Description |
| :--- | :--- | :--- |
| `org_id` | UUID | Organizational context |
| `session_id` | TEXT | Tokenized/Hashed session identifier |
| `pii_detected` | BOOLEAN | Binary indicator of sensitive data presence |
| `sensitive_entities` | JSONB | Map of entity types (Email, SSN, CC) and match counts |
| `compliance_risk_score` | FLOAT | Calculated risk weight (0-100) |

## Voice Governance Signals
In addition to textual PII scanning, the pipeline maps Voice Telemetry and Stream physics natively into the alert risk calculation:
- **Voice Interruptions**: Barge-in triggers alerting when callers cut off agents abnormally.
- **Voice Latency Anomalies**: High response deltas signaling potential LLM stalls.
- **Speech Collision Index**: Percentages quantifying stream cross-talk.
These signals map directly to governance alerts natively triggering incident detection flags.
These indicators aggressively scale the baseline risk parameters to catch volatile emotional phone states.

## Risk Calculation Logic
Compliance risk is calculated using a deterministic weighting system:

- **High Impact (40 points each)**:
  - Credit Card numbers
  - Passport identifiers
- **Medium Impact (20 points each)**:
  - Email addresses
  - Phone numbers
  - Social Security Numbers (SSN)

**Max Score**: 100 (Capped)

## Constraints & Security
- **Asynchronous Execution**: The compliance scan utilizes `setImmediate` and fire-and-forget database inserts to ensure zero impact on the end-to-end request latency.
- **Privacy**: `session_id` is tokenized using SHA-256 HMAC before persistence to maintain a clear boundary between analytical logs and PII-sensitive session data.
- **Isolation**: Every database operation is strictly scoped to the `org_id` of the executing context.

---

## Privacy Shield — PII Redaction Layer

### Why Sensitive Data Must Be Removed from Governance Logs

Governance metadata stores (`facttic_governance_events.metadata` and `audit_logs.metadata`) are **observability surfaces**, not data processing endpoints. They capture operational telemetry — risk scores, latencies, decisions, model identifiers — to power dashboards, forensic audits, and incident timelines.

However, two failure modes can cause sensitive personal data (PII) to leak into these stores:

| Failure Mode | Example |
|---|---|
| **Prompt echo in error messages** | A policy engine error like `"Policy violation in: <user prompt>"` can surface a user's message — including emails, phone numbers, or API keys they typed — directly into `audit_logs.metadata.error` |
| **Misconfigured upstream callers** | An API route that passes a raw user-submitted `model` identifier, or a `user_id` that is an email address rather than a UUID, injects PII into the `GOVERNANCE_EXECUTION` audit record |

The Privacy Shield redaction layer addresses both: it scrubs all string values in metadata objects **before** they reach the database, regardless of how the PII arrived.

> **This is a second line of defence.** The first line — `DataProtection.maskPII()` — operates on raw prompt and response strings during the real-time interception phase. The Privacy Shield operates on structured metadata objects at the persistence boundary.

### Implementation

**File:** `lib/security/redactPII.ts`

**Primary export:** `redactPII<T>(metadata: T): T`

```typescript
import { redactPII } from '@/lib/security/redactPII';

// Any metadata object — redactPII returns the same shape with PII scrubbed
const safe = redactPII({
    error: 'Policy violation for user@example.com',
    procesing_ms: 42,
    session_id: 'a1b2c3d4-...'
});
// → { error: '[REDACTED_EMAIL] violations detected', processing_ms: 42, session_id: 'a1b2c3d4-...' }
```

### Pattern Registry

| Pattern | Token | Detects |
|---|---|---|
| Bearer / JWT / `sk-` / `sbp_` tokens | `[REDACTED_KEY]` | Authorization header leaks, API key fragments in error messages |
| `api_key=`, `secret=`, `token=`, `password=` key-value pairs | `[REDACTED_KEY]` | Query string and JSON fragments with named secrets |
| Email addresses (RFC 5321) | `[REDACTED_EMAIL]` | User emails in error messages or model identifiers |
| Phone numbers (E.164, US/UK formats) | `[REDACTED_PHONE]` | Phone numbers in governance prompts echoed in errors |
| Credit card numbers (Visa/MC/Amex/Discover) | `[REDACTED_CARD]` | PAN numbers in conversation content |
| US Social Security Numbers | `[REDACTED_SSN]` | SSNs in compliance-heavy use cases |

Rules are applied in **priority order** — high-entropy key patterns (priority 1–2) execute before email patterns (priority 3) to prevent partial matches on replacement tokens.

### Pipeline Integration Points

`redactPII()` is called at **all five write points** in `lib/governance/governancePipeline.ts`:

| Write Point | Table | Threat |
|---|---|---|
| Prompt before `computeGovernanceHash()` + `EvidenceLedger.write()` | `facttic_governance_events` | Raw user input — highest-volume PII exposure vector (emails, phone numbers, API keys typed in prompts) |
| `AUTHORIZATION_FAILURE` audit log | `audit_logs` | Auth error messages may echo user-supplied values |
| `GOVERNANCE_CRASH` audit log | `audit_logs` | `err.message` frequently contains prompt fragments from policy engines |
| `GOVERNANCE_EXECUTION` audit log | `audit_logs` | Model name or user_id fields from misconfigured callers |
| Voice modifier metadata patch | `facttic_governance_events` | String fields within voice telemetry objects |

### Design Contract

| Property | Guarantee |
|---|---|
| **Never throws** | Catastrophic redaction failures return `[REDACTION_ERROR]` — the pipeline is never crashed by the privacy layer |
| **UUID preservation** | Internal correlation IDs (UUIDs) are never redacted — only strings containing user data are processed |
| **Non-string passthrough** | Numbers, booleans, null, and undefined are passed through without modification — risk scores and latency values are always preserved intact |
| **Deep traversal** | All nested objects and arrays are walked at any depth — PII nested inside JSONB metadata structures is always found |
| **Structure preservation** | The object shape (key set) is never altered — only string values are mutated |

---

## Prompt Redaction

### Why Raw Prompts Were the Highest-Risk PII Vector

The `prompt` field in `facttic_governance_events` is the single highest-volume, highest-density PII exposure surface in the platform. Unlike governance metadata (which carries derived telemetry — risk scores, latencies, decisions), the prompt column stores raw user-submitted text verbatim. A user who types their email address, phone number, API key, or credit card number into a chat interface has that data stored in plaintext in the forensic ledger on every governance evaluation.

This is categorically worse than incidental PII leakage in error messages: it is **guaranteed, unconditional, high-frequency leakage** of user content into a queryable database table.

### Implementation

The prompt is redacted at the **persistence boundary** — after all in-memory engine evaluation completes, but before any database write occurs:

```typescript
// lib/governance/governancePipeline.ts

// In-memory engine evaluation — raw prompt used for full threat detection fidelity
const policyResult   = PolicyEvaluator.evaluate(prompt, policies);
const guardrailResult = GuardrailDetector.evaluate(prompt, response);
const riskScore      = RiskScorer.computeScore(policyResult, guardrailResult);

// Persistence boundary — PII stripped before any DB write
const sanitizedPrompt = redactPII(prompt);

// sanitizedPrompt used in BOTH hash computation and ledger write
const computedHash = computeGovernanceHash({ prompt: sanitizedPrompt, ... });
await EvidenceLedger.write({ prompt: sanitizedPrompt, ... });
```

### Why the Hash Chain Requires This Order

The governance ledger uses a SHA-256 hash chain where `prompt` is part of the canonical hash input. The DB-side `append_governance_ledger()` RPC independently computes the same hash using the `prompt` value it receives in the `EvidenceLedger.write()` call.

If the application passed `raw prompt` to `computeGovernanceHash()` but `sanitizedPrompt` to `EvidenceLedger.write()`, the two hashes would diverge — the application-side hash would not match the DB-stored hash, and `verifyLedgerIntegrity()` would report every event as tampered. **Both sides must receive the identical `sanitizedPrompt` value.**

```
 raw prompt
     │
     ├──────────────────────────────────────────────────────────┐
     │         in-memory evaluation (full fidelity)             │
     │  PolicyEvaluator · GuardrailDetector · RiskScorer        │
     │                                                          │
     └── redactPII() ──────────────────────────────────────────▼
              sanitizedPrompt
                    │
                    ├── computeGovernanceHash(prompt: sanitizedPrompt)
                    │                        │
                    │                        └── application-side SHA-256
                    │
                    └── EvidenceLedger.write(prompt: sanitizedPrompt)
                                             │
                                             └── DB RPC SHA-256 (must match)
```

### Scope Boundary

| Data | Treatment |
|---|---|
| `prompt` (user input string) | `redactPII(prompt)` applied — PII removed |
| `response` (model output string) | `redactPII(response)` — applied via DataProtection upstream |
| `risk_score` (number) | **Not redacted** — `deepRedact()` passes numbers unchanged |
| `latency` / `duration` (numbers) | **Not redacted** — `deepRedact()` passes numbers unchanged |
| `violations` (array of objects) | Redacted via metadata path — any string values within objects are scrubbed |
| `guardrail_signals` (array of objects) | Redacted via metadata path — `rule_type` strings are internal labels, not PII |

The redaction function specifically preserves all numeric telemetry (`risk_score`, `latency_ms`, `processing_ms`) unchanged, as these are operational metrics with no PII content. Only string leaf values are processed by the regex rules.

