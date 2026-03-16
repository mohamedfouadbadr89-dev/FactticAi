# REALTIME & VOICE ARCHITECTURE AUDIT
**Facttic AI — Product Refactor Branch**
**Audit Date:** 2026-03-08
**Scope:** Supabase Realtime usage, voice webhook architecture, observability gap root cause

---

## TABLE OF CONTENTS

1. [Voice Webhook Architecture](#1-voice-webhook-architecture)
2. [Voice Flow End-to-End](#2-voice-flow-end-to-end)
3. [Supabase Realtime Channel Inventory](#3-supabase-realtime-channel-inventory)
4. [Observability Gap — Root Cause Analysis](#4-observability-gap--root-cause-analysis)
5. [Replication Engine](#5-replication-engine)
6. [Architecture Issues](#6-architecture-issues)
7. [Fix Roadmap](#7-fix-roadmap)

---

## 1. VOICE WEBHOOK ARCHITECTURE

Three voice providers are supported. Each has a dedicated webhook route that validates the signature, normalises the payload, and forwards to the governance pipeline.

### 1.1 ElevenLabs

| Property | Value |
|---|---|
| **Route** | `app/api/integrations/elevenlabs/webhook/route.ts` |
| **Trigger event** | `conversation.ended` OR `status === 'done'` |
| **Signature header** | `x-elevenlabs-signature` (strips `sha256=` prefix) |
| **org_id source** | `body.metadata?.org_id` → `body.conversation_config?.org_id` → `body.org_id` |
| **Transcript field** | `body.transcript` or `body.messages[]` |
| **Forwards to** | `voiceIngestion.ingestConversation()` |

### 1.2 Vapi

| Property | Value |
|---|---|
| **Route** | `app/api/integrations/vapi/webhook/route.ts` |
| **Trigger event** | `end-of-call-report` |
| **Signature header** | `x-vapi-signature` |
| **org_id source** | `body.call?.metadata?.org_id` |
| **Transcript field** | `body.artifact?.transcript` or `body.call?.transcript` |
| **Forwards to** | `voiceIngestion.ingestConversation()` |
| **Note** | Accepts without signature if no `org_id` (onboarding mode — no auth bypass logged) |

### 1.3 Retell

| Property | Value |
|---|---|
| **Route** | `app/api/integrations/retell/webhook/route.ts` |
| **Trigger event** | `call_ended` |
| **Signature header** | `x-retell-signature` (strips `sha256=` prefix) |
| **org_id source** | `body.retell_llm_dynamic_variables?.org_id` |
| **Transcript field** | `body.transcript` or `body.call?.transcript_object[]` |
| **Forwards to** | `voiceIngestion.ingestConversation()` |

### 1.4 Signature Verification

All three providers use `voiceIngestion.verifySignature()`:

```
secret = getIntegrationSecret(org_id, provider)   ← reads external_integrations table
hmac   = HMAC-SHA256(body_bytes, secret)
compare = timingSafeEqual(computed, received)       ← constant-time comparison
```

Retell and ElevenLabs strip `sha256=` prefix before comparison.

---

## 2. VOICE FLOW END-TO-END

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER SPEECH → GOVERNANCE                         │
└─────────────────────────────────────────────────────────────────────────┘

 User speaks
     │
     ▼
 Speech Provider
 (ElevenLabs / Vapi / Retell)
     │  HTTP POST
     ▼
 /api/integrations/{provider}/webhook
     ├── 1. HMAC-SHA256 signature verification (timingSafeEqual)
     │      └── secret from external_integrations table
     ├── 2. Event filter (only call_ended / conversation.ended / end-of-call-report)
     └── 3. voiceIngestion.ingestConversation(normalizedPayload)
              │
              ├── normalizePayload()
              │     ├── ElevenLabs → { transcript, summary, org_id, duration, cost }
              │     ├── Vapi       → { transcript, summary, org_id, duration, cost }
              │     └── Retell     → { transcript, summary, org_id, duration, cost }
              │
              ├── upsert → sessions
              ├── batch insert → session_messages
              │
              └── fire-and-forget POST → /api/governance/execute
                   │  headers: { x-internal-key: INTERNAL_API_KEY }
                   │  body: { session_id, org_id }
                   ▼
              /api/governance/execute
                   ├── 0. FraudDetectionEngine.evaluate()
                   │     └── fraud_score ≥ 70 → disable ALL org API keys + 403
                   │
                   ├── 1. GovernancePipeline.execute()
                   │     └── 10-stage evaluation → decision: ALLOW / WARN / BLOCK
                   │
                   ├── 2. db.insert("governance_event_ledger")
                   │
                   ├── 3. EvidenceLedger.write() → facttic_governance_events
                   │
                   ├── 4. supabaseServer.from('sessions').upsert()
                   │
                   ├── 5. mirrorGovernanceToSession()
                   │
                   └── 6. Supabase Realtime broadcast
                            topic: realtime:telemetry
                            event: governance_event
                            payload: { session_id, org_id, decision, risk_score, timestamp }

                                │
                                ▼
                          ⚠ NO SUBSCRIBER ⚠
                          (see Section 4)
```

**Key architectural constraint:** `ingestConversation()` fires the governance evaluation with `void fetch(...)` — it does not await the response. The webhook returns 200 before governance is complete. There is no callback or status update mechanism after governance finishes.

---

## 3. SUPABASE REALTIME CHANNEL INVENTORY

### 3.1 Broadcast Senders

| Channel Topic | Event Name | Payload Fields | Source File | Method |
|---|---|---|---|---|
| `realtime:telemetry` | `governance_event` | `session_id, org_id, decision, risk_score, timestamp` | `app/api/chat/route.ts` | HTTP POST to `/realtime/v1/api/broadcast` |
| `realtime:telemetry` | `governance_event` | `session_id, org_id, decision, risk_score, timestamp` | `app/api/governance/execute/route.ts` | HTTP POST to `/realtime/v1/api/broadcast` |

Both senders use the **Supabase Realtime REST broadcast API** (not WebSocket):

```
POST ${NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast
Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY
Body: {
  messages: [{
    topic: "realtime:telemetry",
    event: "broadcast",
    payload: {
      type: "broadcast",
      event: "governance_event",
      payload: { session_id, org_id, decision, risk_score, timestamp }
    }
  }]
}
```

### 3.2 Broadcast Receivers (Subscribers)

| Channel Topic | Event | Subscriber Location | Status |
|---|---|---|---|
| `realtime:telemetry` | `governance_event` | — | **NONE FOUND** |

**No server-side or client-side subscriber for `realtime:telemetry` was found in the codebase.** The broadcast is emitted but never consumed.

### 3.3 Governance Stream (Polling — Not Realtime)

| Property | Value |
|---|---|
| **Route** | `app/api/observability/governance-stream/route.ts` |
| **Transport** | Server-Sent Events (SSE) |
| **Update mechanism** | `setInterval(pushEvents, 10000)` — **10-second polling** |
| **Data source** | `governance_event_ledger` |
| **Channel subscription** | **None** |

The code comment in this file explicitly acknowledges the gap:
```ts
// Poll every 10 seconds (In a real system, use Supabase Realtime)
const interval = setInterval(pushEvents, 10000);
```

---

## 4. OBSERVABILITY GAP — ROOT CAUSE ANALYSIS

### Why `/dashboard/observability` is not receiving live events

There are **two compounding problems**:

#### Problem 1: Wrong delivery mechanism (CRITICAL)

```
WHAT IS HAPPENING:
  /api/chat               → broadcasts to realtime:telemetry (HTTP POST)
  /api/governance/execute → broadcasts to realtime:telemetry (HTTP POST)

WHAT /dashboard/observability DOES:
  SSE endpoint polls governance_event_ledger every 10 seconds
  Does NOT subscribe to realtime:telemetry channel
  Does NOT receive pushed events

RESULT:
  The broadcast goes nowhere. No subscriber exists.
  The dashboard only sees data that is ≤10 seconds stale.
  Any event between polls is invisible until the next poll fires.
```

#### Problem 2: Table mismatch (HIGH)

```
WRITE PATH:
  /api/governance/execute → writes to governance_event_ledger (via db.insert)
                          → also writes to facttic_governance_events (via EvidenceLedger)

READ PATH (observability):
  governance-stream       → reads from governance_event_ledger ✓ (correct table)

READ PATH (forensics engines):
  IncidentTimelineEngine  → reads from facttic_governance_events
  RcaGraphEngine          → reads from conversation_timeline  ← wrong table entirely
  IncidentService         → reads from governance_event_ledger
```

Events are written to two tables and read from three different tables depending on the subsystem, causing divergent views of the same data.

#### Problem 3: No client-side Supabase channel subscription

For Supabase Realtime to deliver pushed events to the browser, the dashboard client must call:
```ts
supabase
  .channel('realtime:telemetry')
  .on('broadcast', { event: 'governance_event' }, handler)
  .subscribe()
```
No such subscription exists in any dashboard component.

### Complete Gap Diagram

```
/api/chat / /api/governance/execute
     │
     ├─ writes ──→ governance_event_ledger
     ├─ writes ──→ facttic_governance_events
     └─ broadcasts ──→ realtime:telemetry ──→ [VOID — no subscriber]

/api/observability/governance-stream (SSE)
     └─ polls every 10s ──→ governance_event_ledger ──→ client
        (not realtime, not pushed, not subscribed to channel)

/dashboard/observability client
     └─ receives SSE ──→ renders stale data (up to 10s lag)
        (never receives pushed governance_event broadcasts)
```

---

## 5. REPLICATION ENGINE

| Property | Value |
|---|---|
| **File** | `lib/replicationEngine.ts` |
| **Version** | v4.7 |
| **Status** | **Simulated — no real cross-region replication** |

The `ReplicationEngine` and `FailoverManager` classes exist but perform no actual cross-region replication. `broadcastToPeer()` simulates latency with `Math.random() * 50ms` and logs `PEER_REGION_SYNC_VALIDATED`. No Supabase channel, no SQS, no Pub/Sub is used.

`FailoverManager.checkFailoverHealth()` always returns `true`. `initiateFailover()` only logs.

**Risk:** The system presents multi-region RTO/RPO guarantees (RTO < 60s, RPO < 30s) with no underlying implementation.

---

## 6. ARCHITECTURE ISSUES

| # | Severity | Issue | Location | Impact |
|---|---|---|---|---|
| 1 | **CRITICAL** | Observability SSE uses polling not Supabase Realtime | `app/api/observability/governance-stream/route.ts` | Dashboard never receives pushed events; 10s latency floor |
| 2 | **CRITICAL** | `realtime:telemetry` has no subscriber | `app/api/chat/route.ts`, `app/api/governance/execute/route.ts` | All governance event broadcasts are silently dropped |
| 3 | **HIGH** | Triple table divergence (governance_event_ledger vs facttic_governance_events vs conversation_timeline) | Multiple engines | Different dashboards show different data |
| 4 | **HIGH** | Voice webhook uses fire-and-forget governance forward | `lib/integrations/voiceIngestion.ts` | No governance result returned to voice provider; no error surfacing |
| 5 | **HIGH** | Vapi webhook accepts without signature in onboarding mode | `app/api/integrations/vapi/webhook/route.ts` | Unauthenticated governance injection possible if `org_id` absent |
| 6 | **MEDIUM** | Replication engine is fully simulated | `lib/replicationEngine.ts` | Multi-region claims not backed by implementation |
| 7 | **MEDIUM** | `realtime:telemetry` broadcasts full `risk_score` without org isolation | Both broadcast senders | All channel subscribers see all orgs' risk scores |
| 8 | **LOW** | Both `/api/chat` and `/api/governance/execute` implement identical persistence + broadcast logic | Both route files | Logic duplication; maintenance risk |

---

## 7. FIX ROADMAP

### Fix 1 — Connect observability to Supabase Realtime (P0)

Replace the `setInterval` polling in `governance-stream/route.ts` with a Supabase Realtime subscription, OR update the dashboard client to subscribe to the `realtime:telemetry` channel directly.

**Client-side approach (simpler):**
```ts
// In the observability dashboard component
const channel = supabase
  .channel('realtime:telemetry')
  .on('broadcast', { event: 'governance_event' }, (payload) => {
    // update UI state
  })
  .subscribe()
```

**Server-side SSE approach (requires Supabase Realtime WebSocket from server):**
Not directly supported by Supabase JS server client. Use the REST broadcast API on the consumer side via `@supabase/realtime-js`.

### Fix 2 — Canonicalise to one event table (P0)

Pick one table as the source of truth for all governance events:
- **Recommended:** `facttic_governance_events` (written by `EvidenceLedger`, has hash chain)
- Update `IncidentService` to read from `facttic_governance_events`
- Update `RcaGraphEngine` to read from `facttic_governance_events` (currently reads `conversation_timeline`)
- Update `governance-stream` to read from `facttic_governance_events`

### Fix 3 — Add org isolation to realtime broadcasts (P1)

Scope broadcasts to per-org channels:
```
topic: `realtime:governance:${org_id}`
```
This prevents cross-org data leakage when clients subscribe.

### Fix 4 — Implement voice governance callback (P1)

After `ingestConversation()` forwards to `/api/governance/execute`, poll or use a webhook callback to surface the governance decision back to the voice session record. Currently there is no mechanism to know if a voice call was blocked after the fact.

### Fix 5 — Remove Vapi unauthenticated mode (P1)

Remove the fallthrough path that skips signature verification when `org_id` is absent. All webhook ingestion must be authenticated.

### Fix 6 — Implement actual replication (P2)

Replace the simulated `broadcastToPeer()` in `ReplicationEngine` with a real cross-region message bus (SQS FIFO queues, Google Pub/Sub, or Supabase pg_cron + Postgres logical replication).

---

## APPENDIX: FILE REFERENCE MAP

| File | Role |
|---|---|
| `app/api/integrations/elevenlabs/webhook/route.ts` | ElevenLabs call-end webhook receiver |
| `app/api/integrations/vapi/webhook/route.ts` | Vapi end-of-call-report receiver |
| `app/api/integrations/retell/webhook/route.ts` | Retell call_ended receiver |
| `lib/integrations/voiceIngestion.ts` | Signature verification, payload normalisation, session upsert, governance forward |
| `app/api/governance/execute/route.ts` | Control layer: fraud → pipeline → ledger → broadcast |
| `app/api/chat/route.ts` | Chat entry point: fraud → pipeline → ledger → broadcast |
| `app/api/observability/governance-stream/route.ts` | SSE endpoint: 10s polling from governance_event_ledger |
| `lib/replicationEngine.ts` | Simulated cross-region replication (no real implementation) |
