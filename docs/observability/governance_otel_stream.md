# OpenTelemetry Governance Streaming

## Overview
The **Governance OTel Stream** allows external observability platforms (Prometheus, Datadog, Grafana) to ingest high-fidelity governance signals in real-time. It exports events using the OpenTelemetry-compatible JSON format.

## Event Model
Facttic.ai transforms internal audit signals into OTel log records with the following core attributes:

| Attribute | OTel Key | Description |
| --- | --- | --- |
| Event Type | `event.type` | Identifier (e.g., `policy_violation`, `drift_detected`) |
| Risk Score | `governance.risk_score` | Normalized 0-100 risk index |
| Org ID | `facttic.org_id` | Institutional identifier |
| Metadata | `governance.metadata.*` | Key-value pairs specific to the event type |

## API Integration

### Consume Real-time Stream
**Endpoint**: `GET /api/observability/governance-stream`
**Header**: `Accept: text/event-stream`

The endpoint uses **Server-Sent Events (SSE)** to provide a continuous stream of events.

**Example `curl` Command**:
```bash
curl -N -H "Authorization: Bearer <TOKEN>" \
     -H "Accept: text/event-stream" \
     https://api.facttic.ai/api/observability/governance-stream
```

## Integration Examples

### 1. Prometheus / OpenTelemetry Collector
To ingest these events into an OTel collector, configure an `http_check` or a custom receiver that consumes the Facttic SSE stream and pushes it to your backend.

### 2. Datadog
Use the Datadog Agent's webhooks or Logs API to forward the Facttic OTel streams directly into your Datadog Log management.

## Streamed Events
- `policy_violation`: Triggered when an agent output fails a deterministic policy check.
- `drift_detected`: Triggered when model performance deviates from the 7-day baseline.
- `governance_escalation`: High-priority state changes requiring manual intervention.
- `hallucination_cluster`: Identified patterns of non-factual responses across sessions.
