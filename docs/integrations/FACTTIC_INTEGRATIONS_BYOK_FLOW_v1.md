# BYOK Connection Flow

Facttic AI provides a seamless 5-step lifecycle for connecting your own AI infrastructure. This model ensures that security, governance, and operational integrity are established before any production traffic is routed.

## The 5-Step Guided Setup

### 1. Modality Selection
Users explicitly choose between **Chat** (Text LLMs) and **Voice** (Audio Agents/Streams). This choice determines the underlying governance engines applied to the connection.

### 2. Provider Selection
Facttic supports top-tier infrastructure providers. The list is dynamically filtered based on the selected modality:
- **Chat**: OpenAI, Anthropic, Azure, Custom.
- **Voice**: ElevenLabs, Vapi, Retell, Bland AI, Pipecat.

### 3. Secure Configuration (BYOK)
In this step, users provide their own credentials. Facttic uses dynamic field rendering to ensure the correct requirements are met for each provider (e.g., `Voice ID` for ElevenLabs or `Agent ID` for Vapi).

> [!IMPORTANT]
> **Privacy Guarantee**: All sensitive keys are hashed using SHA-256 on arrival. Facttic never stores plaintext credentials.

### 4. Integrity Verification
Before finalizing, Facttic executes a **Synthetic Test**. This validates:
- **Authentication**: Ensures the provided keys are active.
- **Response Integrity**: Verifies the provider returns valid JSON/Audio.
- **Risk Evaluation**: Passes the test through the Governance Pipeline to ensure the intercept layer is operational.

### 5. Operational Readiness
Once verified, the connection is marked as `Operational`. Organization-specific governance rules, risk scoring, and real-time monitoring are immediately active.

## Technical Implementation
- **Registry**: [providerRegistry.ts](file:///Users/macbookpro/Desktop/FactticAI/lib/integrations/providerRegistry.ts)
- **Wizard**: [ConnectionWizard.tsx](file:///Users/macbookpro/Desktop/FactticAI/components/setup/ConnectionWizard.tsx)
- **Security**: [byok.ts](file:///Users/macbookpro/Desktop/FactticAI/lib/security/byok.ts)
