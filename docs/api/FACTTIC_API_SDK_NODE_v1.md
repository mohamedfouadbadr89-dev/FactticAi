# FACTTIC API SDK NODE v1

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

## Internal Mechanics
The `track()` method automatically generates and resolves `sessions` and `session_turns` inside the connected Supabase instance asynchronously.
