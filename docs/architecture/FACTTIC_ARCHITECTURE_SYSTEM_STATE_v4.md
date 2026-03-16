# FACTTIC SYSTEM STATE v4 (Multimodal Governance)

## SECTION 1 — Platform Overview
Facttic is a comprehensive AI Governance & Reliability Platform designed to supervise, trace, and evaluate AI interactions at scale. The architecture natively supports both text-based Chat and Voice AI systems. 

Following the Phase 13 integration, the platform processes:
- Text interactions (LLM prompt/response loops)
- Voice streaming events (real-time audio transcription and speech bounds)
- Governance telemetry (evaluations against active policy sets)
- Risk scoring (deterministic multi-vector incident bounding)

## SECTION 2 — Core Execution Pipeline
The overarching logic processor enforcing deterministic state boundaries is the `GovernancePipeline`.

The canonical runtime flow spans:
**AI Interaction** → `GovernancePipeline` → `RiskScorer` → `facttic_governance_events` → `alerts` → `forensic_events`

Deterministic scoring remains mathematically preserved. A pure function applies configured policies and guardrails against extracted text, producing a hardened risk metric that dictates whether the transaction is allowed, warned, or blocked natively prior to returning state to the client.

## SECTION 3 — Voice Streaming Governance
The Voice Pipeline operates alongside text interactions, processing high-velocity audio frames.

**Realtime Voice Pipeline**:
Voice Provider
→ `/api/voice/stream`
→ `voice_stream_events`
→ `voiceAnalyzerOrchestrator`
→ `bargeInAnalyzer`
→ `overTalkAnalyzer`
→ `voiceLatencyAnalyzer`
→ numeric risk modifiers
→ `GovernancePipeline`
→ `facttic_governance_events.metadata`

Voice risk signals operate as strictly *optional modifiers*. They stack onto baseline transcript logic but do not break or block standard text execution paths if voice telemetry is missing.

## SECTION 4 — Database Schema Snapshot

### Core Tenancy & State
- `organizations`: Enterprise tenancy groupings.
- `agents`: Monitored AI instances.
- `sessions`: High-level AI conversational state.
- `session_turns`: Incremental request/response state.
- `messages`: Raw user/system texts.

### Voice Telemetry
- `voice_sessions`: Sub-state mapping physical calls to virtual sessions.
- `voice_metrics`: Summarized call performance (packet loss, total interruptions).
- `voice_transcripts`: Finalized post-call provider transcripts.
- `voice_stream_events`: High-frequency realtime speech bounds (`start_ms`/`end_ms`).

### Governance & Observability
- `facttic_governance_events`: Mathematical derivations of all governance executions.
- `alerts`: Actionable triggers for human review.
- `forensic_events`: Deep-dive audit logs mapping UI analysis.

## SECTION 5 — Governance Event Ledger
The absolute source of truth for all executions is the `facttic_governance_events` table.
This table now universally maps Voice capabilities via the `metadata` JSONB column storing physics metrics natively tied to deterministic rules.

Example `metadata`:
```json
{
 "voice_latency_ms": 950,
 "collision_index": 0.32,
 "barge_in": true,
 "latency_penalty": 0.05,
 "collision_penalty": 0.10,
 "barge_in_penalty": 0.15
}
```

## SECTION 6 — Forensics System
The Facttic Forensics environment allows deep-dive analysis bridging root causes back to raw telemetry.
- **Session Replay**: Time-locked inspection of every text turn.
- **Voice Timeline**: Real-time rendering of speech bounds (User/Agent) exposing the literal physical dimensions of the conversation.
- **Governance Alert Overlay**: Instant visualization projecting alerts (`risk_score`) natively bounded onto chronological collisions.

Forensic tools natively merge text transcripts and voice cadences into unified investigation vectors.

## SECTION 7 — Multimodal Risk Engine
The `RiskScorer` acts mathematically on voice physics by appending numeric risk modifiers onto the existing content policies:

- **Voice Latency**: `voice_latency_ms > 800ms` → `+0.05 risk`
- **Speech Collision**: `voice_collision_index > 0.2` → `+0.10 risk`
- **User Interruptions**: `voice_barge_in_detected == true` → `+0.15 risk`

Risk logic incorporates `Math.min(riskScore, 100)` ensuring bounded outputs despite heavy multimodal penalty stacking.

## SECTION 8 — Real-Time Observability
Facttic visual layers subscribe directly to raw streaming pipes bypassing polling:
Dashboard telemetry natively maps to Supabase Realtime WebSocket listeners (`postgres_changes`) covering:
- `voice_stream_events`
- `facttic_governance_events`
- `alerts`

This ensures UI indicators update synchronously with model output cadence.

## SECTION 9 — Platform Capabilities
The current architecture safely powers:
- Chat Governance
- Voice Governance
- Realtime monitoring
- Evaluation datasets
- Simulation testing
- Forensics timeline
- Enterprise deployment (VPC)

## SECTION 10 — System Maturity
**Mature Architecture**: Production-ready governance architecture supporting resilient multimodal AI supervision enforcing rigorous determinism across high-velocity chat schemas and audio-bound streaming systems.
