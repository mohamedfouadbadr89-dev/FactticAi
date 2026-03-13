import type { GovernanceEvent, OtelSpan, StreamExporter } from '../eventStreamer'

/**
 * Datadog APM Trace Exporter
 * Ships governance events as Datadog trace spans via the agent intake API.
 * Set DD_API_KEY + DD_SITE env vars for activation.
 */
export const datadogExporter: StreamExporter = {
  name: 'datadog',

  async export(event: GovernanceEvent, span: OtelSpan): Promise<void> {
    const apiKey = process.env.DD_API_KEY
    if (!apiKey) return // silently skip when not configured

    const site    = process.env.DD_SITE ?? 'datadoghq.com'
    const service = process.env.DD_SERVICE ?? 'facttic-governance'
    const env     = process.env.DD_ENV ?? 'production'

    // Datadog v0.4 trace format: array of trace arrays, each trace is an array of spans
    const ddSpan = {
      trace_id: parseInt(span.traceId.slice(0, 16), 16),
      span_id:  parseInt(span.spanId, 16),
      name:     span.name,
      resource: event.event_type,
      service,
      type:     'web',
      start:    new Date(span.startTime).getTime() * 1_000_000, // nanoseconds
      duration: 1_000_000,
      error:    span.status.code === 'STATUS_CODE_ERROR' ? 1 : 0,
      meta: {
        env,
        'org.id': event.org_id,
        ...Object.fromEntries(
          Object.entries(span.attributes).map(([k, v]) => [k, String(v)])
        ),
      },
    }

    await fetch(`https://trace.agent.${site}/v0.4/traces`, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'DD-API-KEY':      apiKey,
        'X-Datadog-Trace-Count': '1',
      },
      body: JSON.stringify([[ddSpan]]),
    })
  },
}
