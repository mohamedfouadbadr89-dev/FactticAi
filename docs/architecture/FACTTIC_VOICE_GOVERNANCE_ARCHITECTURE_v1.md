# FACTTIC VOICE GOVERNANCE ARCHITECTURE_v1

## Voice Data Model
To integrate Voice Intelligence without degrading the deterministic capabilities of the base chat platform, strict table splits track raw stream telemetry securely:

1. `voice_sessions`: Maps directly to an outer `sessions(id)` parent holding provider and sequence lifecycles.
2. `voice_metrics`: Tracks numeric degradation values across latency, interruptions, audio integrity, and packet loss mapped against the sub-session.
3. `voice_transcripts`: Captures raw string transcriptions delivered either incrementally or post-call.
4. `voice_stream_events`: Captures real-time streaming deltas spanning physical time-bounds, speakers, and incremental text.

## Voice Metrics
Voice specific intelligence metrics are calculated out of bounds from string-based LLM hallucinations.
Variables processed in stream:
- `latency_ms`: Ping TTLs across integrations.
- `packet_loss`: RTP drop percentages.
- `interruptions`: Barge-in or cross-talk spikes mapped incrementally.
- `audio_integrity_score`: A synthetic composite of raw bit-rate degradation signals.

## Post-Call Processing Flow
1. **Webhook Ingress**: Provider finishes call logic, emits final JSON array to `/api/voice/telemetry`.
2. **Ingestion Split**: The API maps payloads into `voice_sessions` and `voice_metrics`.
3. **Normalization**: Any transcripts extracted drop into `voice_transcripts`.
4. **Governance Binding**: Transcripts are passed to the `GovernancePipeline.execute(prompt)` acting as continuous strings exactly like standard LLM calls.

## Realtime Streaming Architecture
1. **Websocket Influx**: Audio deltas and metadata enter `/api/voice/stream` from providers (Vapi, Retell, OpenAI).
2. **Streaming Database Split**: Real-time event signals are flushed into the `voice_stream_events` table immediately.
3. **Array Processing**: Entire stream histories for the session are extracted into a local physics map.

## Voice Stream Event Model
The `VoiceStreamEvent` powers the physics analyzers by standardizing provider variations into:
```typescript
{
  speaker: string
  start_ms: number
  end_ms: number
  transcript_delta?: string
  latency_ms?: number
}
```

## Voice Analyzer Modules
The realtime stream events are fed explicitly into the standalone Voice stream physics engine:

### VOICE STREAM ANALYZERS
These modules operate directly on `VoiceStreamEvent[]`:
- `bargeInAnalyzer`: Detects when a user interrupts the agent (`user.start_ms < agent.end_ms`).
- `overTalkAnalyzer`: Calculates precise millisecond overlap when both the user and agent streams collide (`intersection(user_speech, agent_speech)`).
- `voiceLatencyAnalyzer`: Measures delays bounding exactly how long after `user.end_ms` the `agent.start_ms` fires.
- `voiceAnalyzerOrchestrator`: Consolidates all 3 signals natively mapping the physics metrics into risk evaluations.

## Integration with Governance Engine
Because transcripts and stream risks fall directly back into `GovernancePipeline`, Voice payloads instantly inherit all Facttic policies, PII strippers, Hallucination checks, and Guardrails without duplicate programming. Final decisions write out to `facttic_governance_events` and incidents naturally trigger into `/dashboard/forensics`.

---

## Voice Governance Authentication Layer

### Context

Prior to this update, both voice API routes (`/api/voice/stream` and `/api/voice/telemetry`) called `GovernancePipeline.execute()` without supplying `user_id`. This caused a **compile-time failure** — `user_id` is a required field on the pipeline params. Even if compiled via type bypass, the Zero-Trust `authorizeOrgAccess()` gate at the pipeline entry would always throw `MISSING_IDENTITY`, meaning every voice governance evaluation failed silently.

### Fix

Both routes now extract the authenticated user identity from the Supabase session before the pipeline call, and propagate it as `user_id`:

```typescript
// Both /api/voice/stream and /api/voice/telemetry
const { data: { session } } = await supabase.auth.getSession()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const user_id = session.user.id

await GovernancePipeline.execute({
  user_id,   // ✅ Authenticated identity — Zero-Trust gate now enforced
  org_id,
  prompt,
  ...
})
```

### Authentication Flow (Updated)

```
Voice Provider (Vapi / Retell / OpenAI)
        │
        ▼
/api/voice/stream  ─────────┐
                            │
/api/voice/telemetry ───────┤
                            │
                   ┌────────▼────────────────┐
                   │ supabase.auth.getSession │
                   │  → user_id extracted     │
                   │  → 401 if no session     │
                   └────────┬────────────────┘
                            │
                   ┌────────▼────────────────┐
                   │  org_members lookup      │
                   │  → org_id resolved       │
                   │  → 403 if not member     │
                   └────────┬────────────────┘
                            │
                   ┌────────▼────────────────┐
                   │ GovernancePipeline       │
                   │   .execute({             │
                   │     user_id,  ← verified │
                   │     org_id,              │
                   │     prompt,              │
                   │     voice_signals        │
                   │   })                     │
                   └────────┬────────────────┘
                            │
                   ┌────────▼────────────────┐
                   │ authorizeOrgAccess()     │
                   │ Zero-Trust gate          │
                   │ org_members verification │
                   └─────────────────────────┘
```

### Security Properties

| Property | Before | After |
|---|---|---|
| `user_id` passed to pipeline | ❌ Missing — compile error | ✅ Authenticated session user |
| Zero-Trust gate enforced | ❌ Always throwing `MISSING_IDENTITY` | ✅ Full `authorizeOrgAccess()` check |
| Anonymous voice governance | ✅ Possible (implementation bug) | ❌ Blocked — 401 returned |
| Voice events in forensic ledger | ❌ Never written (pipeline crash) | ✅ Every event persisted and hash-chained |

### Additional Type Fixes (voice/stream)

The `voiceAnalysis.collision.collisionDelta` field referenced in the pipeline call did not exist on the `overTalkAnalyzer` return type. The correct field is `collision_index`. Additionally, optional voice params now use **conditional object spread** (`...(condition && { field: value })`) instead of ternary-returning-`undefined`, which satisfies TypeScript's `exactOptionalPropertyTypes` compiler flag:

```typescript
// Before (type error under exactOptionalPropertyTypes):
voice_latency_ms: voiceAnalysis.latency.isHighLatency ? voiceAnalysis.latency.latency_ms : undefined

// After (correct):
...(voiceAnalysis.latency.isHighLatency && { voice_latency_ms: voiceAnalysis.latency.latency_ms })
```

---

## Realtime Streaming Transport Layer

### Architectural Shift
Prior to `v3.9`, the `/api/voice/stream/route.ts` processed continuous voice ingestion via repeated, unary HTTP POSTs. At a scale of >500 streams per second, evaluating `supabase.auth.getSession()`, verifying org_members logic, and persisting to Postgres on every single `start_ms`/`end_ms` delta led directly to PgBouncer saturation and API gateway timeout cascades (503s). 

To secure load resilience, Facttic introduced **persistent WebSocket ingestion** via `/api/voice/socket/route.ts`. 

*(Note: The legacy `/api/voice/stream/route.ts` remains active solely for backward compatibility with external providers unable to transition to WebSocket immediately).*

### Handshake & Context Initialization

The WebSocket connection implements a strict upgrade handshake:
1. **Authentication (Once)**: Connectors pass `session_id` alongside standard HTTP cookies. `supabase.auth.getSession()` executes **exactly once per connection**, not per audio chunk. 
2. **Org Membership Verification**: After auth, the handler retrieves `voice_sessions` ensuring the socket caller belongs to the tenant.
3. **In-Memory Context**: An active connection state buffer is created locally on the Node gateway, stripping out database overhead for ongoing data ingest.

### Stream Ingestion Payload
The open socket accepts JSON payloads containing incremental audio states natively matching the original schema:

```json
{
  "start_ms": 1500,
  "end_ms": 1700,
  "speaker": "user",
  "transcript_delta": "Yes absolutely.",
  "latency_ms": 40
}
```

### Buffering & Semantic Boundaries
Rather than hitting `GovernancePipeline.execute(chunk)` repeatedly—which requires expensive synchronous PII traversal and Postgres ledger hash-chain computations—Facttic performs **Memory Buffering**:

1. Chunks are aggregated natively within an in-memory `Map<string, SessionContext>`.
2. A **Semantic Boundary Check** executes on each push. The payload is flushed ONLY when the algorithm detects a natural break in speech:
    - **Punctuation Detect**: `.`, `?`, or `!` ends the sentence.
    - **Physical Pause**: `(current_end_ms - last_flush_ms > 1500ms)` indicating a speech break.

3. When a boundary hits, the arrays are flattened and the unified transcript block is executed seamlessly through the `GovernancePipeline`. This structural upgrade reduces 1,000 parallel synchronous operations per second down to roughly 10 meaningful, actionable governance executions per second per stream.

### Voice Buffer Hard Limits (OOM Protection)
Because the WebSocket buffer evaluates semantic boundaries (periods, pauses), it is susceptible to a malicious or failing transcript integration streaming continuous unbroken text. This creates a Denial of Service (OOM Crash) as the `sessionBuffers` arrays infinitely grow until they reach the Node V8 memory boundaries.

To shield the array execution environment, the buffer strictly enforces three bounds over the connection socket:
1. **Maximum Chunks (`MAX_CHUNKS`):** Caps array indices. Default `50`.
2. **Maximum Buffer Size (`MAX_BYTES`):** Constrains byte-weight evaluated over UTF-8 decoding. Default `65536` (`64KB`).
3. **Maximum Time-In-Flight (`MAX_DURATION_MS`):** Assures payload completion limits. Default `10000ms`.

If any tenant hits an upper limit constraint before meeting a semantic sentence boundary, the system initiates a `forceFlush()`. This algorithm intercepts the array prior to bounds failure, cleanly serializes the transcript chunks up to that precise delta length, immediately dispatches the payload context straight into the `GovernancePipeline`, and aggressively flushes all underlying `chunks` variables to secure container memory stability.

### WebSocket Connection Limits

To prevent adversarial exhaustion of Node.js container memory through massive socket counts, the `/api/voice/socket` gateway enforces a dual-layered connection gate:

1. **Global Cap (`MAX_ACTIVE_STREAMS`):** The gateway maintains a strict limit of **1,000 parallel active sessions**. New handshake requests beyond this threshold are rejected with a `429 Too Many Requests` status to preserve platform-wide stability.
2. **Per-Organization Multi-Tenancy Cap (`MAX_STREAMS_PER_ORG`):** To prevent a single rogue tenant from starving the global pool, each organization is capped at **100 parallel streams**. 

All handshakes verify these limits **post-authentication but pre-initialization**, ensuring unauthenticated requests cannot impact these counters while malicious authenticated actors are structurally contained. Cleanup is handled automatically via the `handleSocketDisconnect` hook which decrements both the global and organization tracking maps.

