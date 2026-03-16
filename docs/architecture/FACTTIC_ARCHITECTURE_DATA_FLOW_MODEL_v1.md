# FACTTIC ARCHITECTURE DATA FLOW MODEL_v1

## Purpose
This document formally defines the end-to-end data flow within the Facttic governance architecture, ensuring all telemetry, compliance, and application data transitions enforce strict constitutional state rules.

## Architecture Diagram Description
- **API Gateway Layer**: All requests ingest here, with synchronous pre-flight governance telemetry sent out.
- **Facttic Core Engine**: Processes raw metrics against active risk policies.
- **Storage Subsystem**: Asynchronously commits hashed event derivations to Supabase, guaranteeing ledger immutability.

## Data Flow Explanation
1. **Ingestion**: Client payloads securely enter via HTTPS TLS 1.3 endpoints.
2. **Telemetry extraction**: Interceptor strips PII, hashes remaining telemetry, streams to governance engine.
3. **Evaluation**: Local cache checks risk flags. On miss or high uncertainty, queries Supabase RPC deterministic risk scorer.
4. **Resolution**: Final decision state is attached to the ledger and transaction continues or halts.

## VOICE REALTIME GOVERNANCE PIPELINE

Voice Provider
→ `/api/voice/stream`
→ `voice_stream_events`
→ `voiceAnalyzerOrchestrator`
→ numeric risk modifiers
→ `GovernancePipeline`
→ `facttic_governance_events.metadata`

Note: `voice_stream_events` represents time-segmented speech events parsed natively into bounds.


## Evaluation Framework Storage

Tables:
- `evaluation_runs`
- `deployment_configs`
- `audit_logs`
- `facttic_governance_events`

Explain purpose:
- **evaluation_runs** → stores regression and dataset testing results
- **deployment_configs** → controls deployment mode (saas/vpc/self-host)
- **audit_logs** → tracks security and governance actions
- **facttic_governance_events.metadata (jsonb)** → purpose: store voice risk telemetry such as `latency_penalty`, `collision_penalty`, and `barge_in_penalty`.

## Security Implications
- Complete isolation of PII. Facttic only evaluates hashed and structured telemetry.
- Zero-trust default. No transaction is allowed to bypass the interceptor layer.

## Integration Points
- Enterprise identity providers (SAML/OIDC).
- SIEM observability sinks (Datadog, Splunk).
