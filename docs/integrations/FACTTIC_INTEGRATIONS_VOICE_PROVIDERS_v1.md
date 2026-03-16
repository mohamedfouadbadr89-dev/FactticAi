# Voice Infrastructure Governance

Facttic AI provides deterministic governance for the next generation of voice-first AI applications. By intercepting audio-modality streams, Facttic ensures security, compliance, and reliability for real-time voice interactions.

## Supported Providers

Facttic currently supports the following voice infrastructure platforms:

| Provider | Core Capability | Governance Focus |
| :--- | :--- | :--- |
| **ElevenLabs** | Voice Synthesis | Deepfake detection & content safety |
| **Vapi** | Real-time Orchestration | Latency profiling & protocol integrity |
| **Retell AI** | Conversational Voice | Compliance monitoring & session replay |
| **Bland AI** | Automated Infrastructure | Mass-scale automation guardrails |
| **Pipecat** | Open Source (OSS) | Standardized interception & customization |

## Governance Modality Differences

Governing **Voice** differs from **Chat** in several key architectural ways:

1.  **Temporal Latency**: Voice governance requires sub-20ms evaluation to avoid disrupting conversational flow. Facttic uses asynchronous acoustic analysis for non-blocking interception.
2.  **Streaming Interception**: Unlike text-based Request/Response, voice involves persistent WebRTC/RTP streams. Facttic intercepts at the protocol layer.
3.  **Acoustic Risk**: Beyond semantic content, voice risk includes emotional escalation, identity fraud (deepfakes), and background signal anomalies.

## Adding New Voice Providers

To add a new voice provider to the Facttic ecosystem:

1.  **Registry Update**: Add the provider definition to `lib/integrations/providerRegistry.ts` with `modality: 'voice'`.
2.  **Protocol Mapping**: Map the provider's specific streaming protocol (e.g., ElevenLabs SSE vs Vapi WebSockets) to the Facttic Interceptor.
3.  **UI Verification**: Ensure the provider appears in the [Connection Wizard](file:///dashboard/connect) when **Voice Mode** is active.

## Technical Implementation

Voice connections are persisted with `interaction_mode: 'voice'` in the `ai_connections` table, ensuring that observability and simulation tools automatically filter for audio-modality metrics.
