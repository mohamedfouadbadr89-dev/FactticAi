# Provider Verification Guide

Facttic AI implements a rigorous verification layer to ensure that every AI infrastructure connection is active, securely authenticated, and high-performance.

## Verification Lifecycle

The verification process occurs in **Step 4** of the [Connection Wizard](file:///Users/macbookpro/Desktop/FactticAI/components/setup/ConnectionWizard.tsx) and is enforced by the API before persistence.

### Process

1.  **Direct Ping**: Facttic executes a lightweight authentication request to the provider's management API (e.g., fetching models or workspace metadata).
2.  **Latency Measurement**: The round-trip time (RTT) is recorded to establish a performance baseline.
3.  **Integrity Check**: The response is validated for structural correctness.

## Provider-Specific Endpoints

| Provider | Verification Method | Source of Truth |
| :--- | :--- | :--- |
| **OpenAI** | `GET /v1/models` | OpenAI Models API |
| **Anthropic** | `POST /v1/messages` (probe) | Claude Haiku probe |
| **ElevenLabs** | `GET /v1/voices` | Voice Inventory |
| **Vapi** | `GET /agent` | Agent Configuration |
| **Retell AI** | `GET /get-retell-llm-list` | LLM Resource Registry |
| **Bland AI** | `GET /v1/agents` | Bland Infrastructure |
| **Azure / Custom** | `Endpoint Ping` | User-defined URL |

## Response Interpretation

### Success
- **Message**: "Connection Successful"
- **Latency**: Provider response time in milliseconds.
- **Status**: Operational.

### Failure Modes
- **Auth Error**: "Invalid API key" — Credentials rejected by provider.
- **Timeout**: "Connection timeout" — Provider did not respond within 10s.
- **Config Error**: "Invalid Model/ID" — Reference ID not found on provider.

## Security Note

All verification requests are executed via Facttic's secure backend. API keys are present only in volatile memory during the request and are hashed before leaving the handler context.
