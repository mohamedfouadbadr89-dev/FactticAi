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
