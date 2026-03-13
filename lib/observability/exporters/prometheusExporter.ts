import type { GovernanceEvent, OtelSpan, StreamExporter } from '../eventStreamer'

/**
 * Prometheus Pushgateway Exporter
 * Pushes governance event counters to a Prometheus Pushgateway.
 * Set PROMETHEUS_PUSHGATEWAY_URL env var for activation.
 */

// In-process counter — reset on cold start (acceptable for push model)
const counters: Record<string, number> = {}

export const prometheusExporter: StreamExporter = {
  name: 'prometheus',

  async export(event: GovernanceEvent, _span: OtelSpan): Promise<void> {
    const gatewayUrl = process.env.PROMETHEUS_PUSHGATEWAY_URL
    if (!gatewayUrl) return

    // Increment in-process counter
    const key = event.event_type.replace(/\./g, '_')
    counters[key] = (counters[key] ?? 0) + 1

    // Build Prometheus text format exposition
    const lines: string[] = [
      '# HELP facttic_governance_events_total Total governance events by type',
      '# TYPE facttic_governance_events_total counter',
      ...Object.entries(counters).map(
        ([evType, count]) =>
          `facttic_governance_events_total{event_type="${evType}",org_id="${event.org_id}"} ${count}`
      ),
    ]

    const jobName = `facttic_governance`
    const pushUrl = `${gatewayUrl}/metrics/job/${jobName}/instance/${event.org_id}`

    await fetch(pushUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body:    lines.join('\n') + '\n',
    })
  },
}
