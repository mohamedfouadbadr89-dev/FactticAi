# Multi-Provider Orchestration

Facttic AI supports connecting multiple AI infrastructure providers simultaneously, allowing organizations to manage a heterogeneous AI stack from a single governance plane.

## Key Capabilities

- **Simultaneous Connections**: Connect multiple Chat (LLMs) and Voice (Audio Agents) providers for different business units or use cases.
- **Redundancy & Failover**: Configure secondary providers for high-availability scenarios.
- **Granular Governance**: Apply specific risk policies and monitoring rules to each connection individually.

## Connection Management

All active connections are managed via the [Connection Dashboard](file:///Users/macbookpro/Desktop/FactticAI/app/dashboard/connect/page.tsx).

### Viewable Metrics
- **Provider Status**: Real-time health (Operational, Degraded, Offline).
- **Latency**: Provider-specific response times measured during the latest verification.
- **Interaction Mode**: Clear distinction between Chat and Voice infrastructure.

## Routing and Policy Enforcement

When multiple providers are connected, Facttic routes traffic based on the `provider_id` header or specific endpoint configuration. The **Governance Pipeline** remains provider-agnostic, intercepting requests and applying safety checks before they reach the provider infrastructure.

## Data Persistence
- **Table**: `ai_connections`
- **Identifier**: `org_id` (Allows multiple rows)
- **Security**: All API keys are stored as non-reversible SHA-256 hashes.
