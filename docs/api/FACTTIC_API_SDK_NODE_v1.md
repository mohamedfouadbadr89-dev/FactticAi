# FACTTIC API SDK NODE v1 (v5.0 — Real-Time Voice Ready)
Verified against Live Supabase Production on March 19, 2026.

## Purpose
The official Node.js SDK for Facttic. This library securely bridges your AI application layer to the Facttic Governance and Observability backends with a simple async tracking call.

## Installation
```bash
npm install @facttic/sdk-node
```

## Basic Initialization & Tracking

```typescript
import { FactticSDK } from '@facttic/sdk-node';

const facttic = new FactticSDK({
    apiKey: process.env.FACTTIC_API_KEY
});

async function handleAI() {
    // Generative AI inference
    const prompt = "Can you help me reset my password?";
    const response = "Sure, click here to reset your password.";

    // Track the interaction and receive dynamic risk scores
    const feedback = await facttic.track({
        prompt,
        response,
        model: "gpt-4",
        user_id: "usr_12345"
    });

    console.log(`Live Risk Score: ${feedback.risk_score}`);
    
    if (feedback.policy_flags.length > 0) {
        console.warn("Policy Violated!", feedback.policy_flags);
        // Halt application flow if risk is too high
    }
}
```

## Real-Time Voice Telemetry

The v5.0 SDK supports hardware-level voice stream monitoring. Callers must include a `client_sent_at` timestamp for True-Latency verification.

```typescript
// Tracking a Voice snapshot
const result = await facttic.trackVoice({
  session_id: "voice_usr_456",
  latency_ms: 45,
  packet_loss: 2,
  audio_integrity_score: 98,
  client_sent_at: Date.now() // Required for 150ms security floor
});

if (result.action === 'INTERRUPT') {
  // Execute hardware kill switch (e.g., stop AWS Lex/Twilio stream)
  killStream(result.signal);
}
```

## Internal Mechanics
The `track()` and `trackVoice()` methods are bound to the **Fail-Closed Governance Pipeline**. Every call is subjected to a 50ms latency budget and a 30ms atomic ledger write.
