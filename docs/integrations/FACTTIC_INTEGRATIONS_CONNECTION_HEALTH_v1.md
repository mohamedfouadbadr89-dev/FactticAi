# Connection Health Protocol

Facttic AI provides a multi-dimensional health scoring system for AI infrastructure, ensuring that governance is never blind to provider instability or authentication drift.

## Health Status Definitions

### 🟢 Connected
The provider is fully operational.
- **Connectivity**: < 500ms latency.
- **Authentication**: Valid and active.
- **Integrity**: No recent governance policy violations or interceptor failures.

### 🟡 Degraded
The connection is established but performance or integrity is compromised.
- **Connectivity**: > 2000ms latency.
- **Integrity**: Intermittent policy violations (e.g., hallucination spikes or PII leaks) detected in the last 10 minutes.
- **Response**: Governance engines remain active but alert thresholds are lowered.

### 🔴 Disconnected
The link to the provider AI infrastructure is severed.
- **Connectivity**: Request timeout or 5xx provider errors.
- **Authentication**: Invalid API key or revoked credentials (401/403).
- **Manual Intervention**: Required to restore service.

## Health Scoring Algorithm

The `getProviderStatus` service computes health by correlating three data streams:

1.  **Synthetic Probes**: Lightweight periodic pings to provider management APIs.
2.  **Ledger Telemetry**: Real-time analysis of the [Governance Event Ledger](file:///Users/macbookpro/Desktop/FactticAI/docs/architecture/governance-ledger.md) for execution exceptions.
3.  **Authentication Heartbeat**: Continuous validation of hashed key rotation and access tokens.

## Implementation Details
- **Logic Service**: [providerHealth.ts](file:///Users/macbookpro/Desktop/FactticAI/lib/integrations/providerHealth.ts)
- **Monitoring View**: [Connection Dashboard](file:///Users/macbookpro/Desktop/FactticAI/app/dashboard/connect/page.tsx)
- **API enforcement**: [verifyConnection.ts](file:///Users/macbookpro/Desktop/FactticAI/lib/integrations/verifyConnection.ts)
