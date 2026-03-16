# BYOK (Bring Your Own Key) Philosophy

Facttic AI is built on a "Privacy First, Governance Always" architecture. The Bring Your Own Key (BYOK) system ensures that organizations maintain full control over their AI infrastructure costs, limits, and provider relationships without Facttic ever managing or storing sensitive credentials.

## Core Security Principles

1.  **Zero-Persistence of Secrets**: Facttic never stores plaintext API keys in any database, cache, or log file.
2.  **Deterministic Hashing**: All API keys are hashed on arrival using the SHA-256 algorithm. This creates a one-way, non-reversible reference used to identify the connection.
3.  **Volatile Verification**: Plaintext keys only exist in volatile server memory for the duration of a verification request (e.g., checking if the key is valid with the provider). Once the request completes, the memory is cleared.

## How It Works

When an organization connects a provider (e.g., ElevenLabs or OpenAI):

1.  The user enters the API key in the [Connection Wizard](file:///dashboard/connect).
2.  The key is sent over an encrypted TLS connection to the Facttic API.
3.  The API immediately calls `hashApiKey()` to generate a unique fingerprint.
4.  Only the **Hashed Reference** is persisted in the `ai_connections` table.

## Why BYOK?

-   **Billing Autonomy**: Organizations bridge their own accounts directly (e.g., Vapi, Anthropic), ensuring they keep their existing tier discounts and usage limits.
-   **Risk Mitigation**: In the event of a system breach, there are no raw keys to steal. An attacker would only find non-reversible hashes that cannot be used to authenticate with providers.
-   **Transparency**: Facttic acts as a governance layer, not a middleman. You bring the infrastructure; we bring the safety.

## Technical Implementation

The hashing logic is centralized in [lib/hash.ts](file:///Users/macbookpro/Desktop/FactticAI/lib/hash.ts) and enforced via the [Security Helper](file:///Users/macbookpro/Desktop/FactticAI/lib/security/byok.ts).
