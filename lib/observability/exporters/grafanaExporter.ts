import type { GovernanceEvent, OtelSpan, StreamExporter } from '../eventStreamer'

/**
 * Grafana Loki Log Stream Exporter
 * Forwards governance events as structured log streams to a Grafana Loki endpoint.
 * Set GRAFANA_LOKI_URL (+ optional GRAFANA_API_KEY) env vars for activation.
 */
export const grafanaExporter: StreamExporter = {
  name: 'grafana',

  async export(event: GovernanceEvent, span: OtelSpan): Promise<void> {
    const lokiUrl = process.env.GRAFANA_LOKI_URL
    if (!lokiUrl) return

    const apiKey = process.env.GRAFANA_API_KEY
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const unixNs = String(new Date(span.startTime).getTime() * 1_000_000)

    const logLine = JSON.stringify({
      traceId:    span.traceId,
      spanId:     span.spanId,
      event_type: event.event_type,
      org_id:     event.org_id,
      status:     span.status.code,
      ...event.payload,
    })

    const body = {
      streams: [
        {
          stream: {
            source: 'facttic-governance',
            event_type: event.event_type,
            org_id:  event.org_id,
            env:     process.env.APP_ENV ?? 'production',
          },
          values: [[unixNs, logLine]],
        },
      ],
    }

    await fetch(`${lokiUrl}/loki/api/v1/push`, {
      method:  'POST',
      headers,
      body:    JSON.stringify(body),
    })
  },
}
