# FACTTIC FORENSICS VOICE TIMELINE_v1

## Purpose
This document defines how the Facttic Voice Forensics engine visualizes and audits real-time chronological interactions between AI agents and human callers, ensuring high-fidelity stream playback of speech boundaries and overlapping collisions.

## Voice Stream Event Visualization
The timeline relies on rendering exact start/end millisecond bounding box elements for every speech fragment tracked by the `voice_stream_events` table.
- **User Bounds**: Displayed in secondary colors mapping human speech durations.
- **Agent Bounds**: Displayed in primary brand colors mapping AI speech outputs.
- **Intersection Bounds**: Bright warning overlays specifically visualizing instances where bounds overlap.

## Realtime Timeline Rendering
Timeline lengths dynamically span `<max_end> - 0` mapping the total session duration.
Elements are rendered as DOM percentages relative to `total_speech_time`, where:
`width% = (event.end_ms - event.start_ms) / total_speech_time * 100`.

- **User Speech**: blue (`bg-blue-500`)
- **Agent Speech**: green (`bg-green-500`)

## Realtime Event Subscription
To provide immediate observability during live investigations, the dashboard utilizes two Supabase Realtime bindings listening natively to the `voice_stream_events` and `facttic_governance_events` tables via WebSocket `postgres_changes`. Updates instantly push delta strings and boundaries into the UI timeline loop.

## Voice Risk Visualization & Governance Alert Overlay
Real-time violations detected by the `voiceAnalyzerOrchestrator` are asynchronously passed to the standard `GovernancePipeline`. 
Subsequently, `facttic_governance_events` trigger alerts natively onto the same active timeline bounding exact points where Policy or Drift infractions occur natively syncing the AI's textual logic faults with its vocal cadence bounds.

Governance alerts are overlaid as timeline markers indicating precise timestamps, mapped by severity:
- **Low Severity** (`risk_score < 40`): yellow (`bg-yellow-500`)
- **Medium Severity** (`risk_score >= 40`): orange (`bg-orange-500`)
- **High Severity** (`risk_score >= 70`): red (`bg-red-500`)
